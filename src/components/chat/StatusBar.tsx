interface StatusBarProps {
  modelName: string;
  status: string;
}

const StatusBar = ({ modelName, status }: StatusBarProps) => {
  return (
    <div className="glass-effect border-t border-border px-6 py-3 flex justify-between text-xs text-muted-foreground">
      <span>
        Model: <strong className="text-primary">{modelName}</strong>
      </span>
      <span>
        Status: <strong className="text-accent">{status}</strong>
      </span>
    </div>
  );
};

export default StatusBar;
