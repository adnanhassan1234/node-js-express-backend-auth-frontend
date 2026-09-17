import { styleForStatus } from '../utils/statusStyles';

/** Status pill — table aur modal dono me use hota hai */
const StatusBadge = ({ status }) => {
  const style = styleForStatus(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${style.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status}
    </span>
  );
};

export default StatusBadge;
