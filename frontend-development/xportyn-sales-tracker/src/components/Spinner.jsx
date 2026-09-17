/** Loading spinner — API calls ke dauran dikhta hai */
const Spinner = ({ size = 'md', label }) => {
  const sizes = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-[3px]',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6">
      <div
        className={`${sizes[size]} animate-spin rounded-full border-slate-200 border-t-brand-600`}
      />
      {label && <p className="text-sm text-slate-500">{label}</p>}
    </div>
  );
};

export default Spinner;
