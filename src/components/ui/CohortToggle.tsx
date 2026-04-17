import { BenchmarkToggle } from "./BenchmarkToggle";

interface CohortToggleProps {
  value: "all" | "top10";
  onChange: (value: "all" | "top10") => void;
}

export function CohortToggle({ value, onChange }: CohortToggleProps) {
  return (
    <BenchmarkToggle
      value={value}
      onChange={onChange}
      options={[
        { value: "all", label: "All Players" },
        { value: "top10", label: "Top 10 + Ties" },
      ]}
    />
  );
}

