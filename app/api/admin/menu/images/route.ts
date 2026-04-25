import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { NextRequest, NextResponse } from "next/server";

import { requireApiSession } from "@/lib/auth/server";
import { getRuntimeEnv } from "@/lib/config/runtime-env";
import {
  createErrorResponse,
  createRequestObservation
} from "@/lib/observability/runtime-observability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME_EXTENSION_MAP: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/avif": ".avif"
};

function getUploadTarget() {
  const uploads = getRuntimeEnv().uploads;

  return {
    absoluteDirectory: path.join(
      /* turbopackIgnore: true */ process.cwd(),
      uploads.baseDir
    ),
    publicPathPrefix: uploads.publicBasePath
  };
}

export async function POST(request: NextRequest) {
  const observation = createRequestObservation(request, {
    category: "upload",
    action: "dish-image"
  });
  const auth = await requireApiSession(request, ["ADMIN"]);
  if (!auth.ok) {
    return observation.finish(
      NextResponse.json(auth.body, { status: auth.status }),
      { result: auth.status === 401 ? "unauthenticated" : "forbidden" }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return observation.finish(
        NextResponse.json({ error: "Image file is required." }, { status: 400 }),
        { result: "missing_file" }
      );
    }

    if (!MIME_EXTENSION_MAP[file.type]) {
      return observation.finish(
        NextResponse.json(
          { error: "Only JPG, PNG, WebP, and AVIF images are allowed." },
          { status: 400 }
        ),
        { result: "invalid_type" }
      );
    }

    if (file.size <= 0) {
      return observation.finish(
        NextResponse.json({ error: "Uploaded image is empty." }, { status: 400 }),
        { result: "empty_file" }
      );
    }

    if (file.size > getRuntimeEnv().uploads.maxImageBytes) {
      return observation.finish(
        NextResponse.json(
          { error: "Image must be 5 MB or smaller." },
          { status: 400 }
        ),
        { result: "file_too_large" }
      );
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const extension = MIME_EXTENSION_MAP[file.type];
    const fileName = `${Date.now()}-${randomUUID()}${extension}`;
    const target = getUploadTarget();

    await mkdir(target.absoluteDirectory, { recursive: true });
    await writeFile(path.join(target.absoluteDirectory, fileName), bytes);

    return observation.finish(
      NextResponse.json(
        {
          url: `${target.publicPathPrefix}/${fileName}`
        },
        { status: 201 }
      ),
      { result: "uploaded", fileSizeBytes: file.size }
    );
  } catch (error) {
    observation.fail(error, { result: "exception" });
    return observation.finish(
      createErrorResponse("Unable to store uploaded image."),
      { result: "exception" }
    );
  }
}
