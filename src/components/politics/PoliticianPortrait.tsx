type PoliticianPortraitProps = {
  name: string;
  photo?: string | null;
  className?: string;
  imageClassName?: string;
};

const PoliticianPortrait = ({ name, photo, className = "", imageClassName = "" }: PoliticianPortraitProps) => {
  const initials = name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();

  if (photo) {
    return <img src={photo} alt={name} loading="lazy" className={imageClassName || "h-full w-full object-cover"} />;
  }

  return (
    <div className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br from-primary/25 via-accent/20 to-primary/10 ${className}`} aria-label={name}>
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-primary/20 to-transparent" />
      <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-card/80 text-2xl font-black text-primary shadow-lg ring-4 ring-card/50 sm:h-24 sm:w-24 sm:text-3xl">
        {initials}
      </div>
      <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-card/90 px-2 py-1 text-center text-[10px] font-bold uppercase tracking-wide text-foreground shadow-sm">
        Campaign profile
      </div>
    </div>
  );
};

export default PoliticianPortrait;