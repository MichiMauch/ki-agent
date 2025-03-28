// components/TaskCard.tsx
type TaskCardProps = {
  task: {
    id: string;
    key: string;
    summary: string;
    status: string;
    due: string | null;
    assignee: string;
    lastStatusChange: string | null;
    lastStatusFrom: string | null;
    lastStatusTo: string | null;
    sprint: string | null;
  };
};

export default function TaskCard({ task }: TaskCardProps) {
  return (
    <li className="p-4 border rounded-lg shadow-sm">
      <div className="font-semibold">{task.key}</div>
      <div>{task.summary}</div>
      <div className="text-sm text-gray-500">Status: {task.status}</div>
      <div className="text-sm text-gray-500">
        Zugewiesen an: {task.assignee}
      </div>
      {task.due && (
        <div className="text-sm text-gray-400">
          Fällig am: {new Date(task.due).toLocaleDateString("de-CH")}
        </div>
      )}
      {task.lastStatusChange && (
        <div className="text-sm text-gray-400">
          Von <span className="italic">{task.lastStatusFrom}</span> →{" "}
          <span className="italic">{task.lastStatusTo}</span> am{" "}
          {new Date(task.lastStatusChange).toLocaleString("de-CH", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      )}
      {task.sprint && (
        <div className="text-sm text-gray-500">Sprint: {task.sprint}</div>
      )}
    </li>
  );
}
