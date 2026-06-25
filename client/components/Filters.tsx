import {
  PRIORITY_OPTIONS,
  SORT_OPTIONS,
  STATUS_OPTIONS,
  type TicketFilters,
  type TicketPriority,
  type TicketSort,
  type TicketStatus,
} from "@/lib/types";

import FilterPills from "./FilterPills";
import Segmented from "./Segmented";

interface Props {
  filters: TicketFilters;
  onChange: (filters: TicketFilters) => void;
}

function toggle<T>(current: T[] | undefined, value: T): T[] | undefined {
  const list = current ?? [];
  const next = list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  return next.length > 0 ? next : undefined;
}

export default function Filters({ filters, onChange }: Props) {
  return (
    <div className="filters">
      <div className="filters__field">
        <span className="filters__label">Status</span>
        <FilterPills
          options={STATUS_OPTIONS}
          selected={filters.status ?? []}
          onToggle={(value: TicketStatus) =>
            onChange({ ...filters, status: toggle(filters.status, value) })
          }
          ariaLabel="Filter by status"
        />
      </div>

      <div className="filters__field">
        <span className="filters__label">Priority</span>
        <FilterPills
          options={PRIORITY_OPTIONS}
          selected={filters.priority ?? []}
          onToggle={(value: TicketPriority) =>
            onChange({ ...filters, priority: toggle(filters.priority, value) })
          }
          ariaLabel="Filter by priority"
        />
      </div>

      <div className="filters__field">
        <span className="filters__label">Sort</span>
        <Segmented
          options={SORT_OPTIONS}
          value={filters.sort ?? "newest"}
          onChange={(value: TicketSort) => onChange({ ...filters, sort: value })}
          ariaLabel="Sort tickets"
        />
      </div>
    </div>
  );
}
