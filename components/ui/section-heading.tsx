type SectionHeadingProps = {
  title: string;
  description: string;
};

export function SectionHeading({
  title,
  description
}: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <h1 className="title">{title}</h1>
      <p className="description">{description}</p>
    </div>
  );
}
