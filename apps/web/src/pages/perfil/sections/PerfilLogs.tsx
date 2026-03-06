import Timeline from "@mui/lab/Timeline";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import { Card, CardContent, Typography } from "@mui/material";

export default function PerfilLogs() {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="h6" className="card-title">
          Logs
        </Typography>
        <Timeline className="items-start overflow-auto">
          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot color="success" variant="outlined" />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="subtitle2" className="text-text-primary">
                Login
              </Typography>
              <Typography variant="body2" className="line-clamp-1 text-text-secondary">
                Você acessou o sistema.
              </Typography>
              <Typography variant="body2" className="text-text-disabled">
                Recente
              </Typography>
            </TimelineContent>
          </TimelineItem>

          <TimelineItem>
            <TimelineSeparator>
              <TimelineDot color="info" variant="outlined" />
              <TimelineConnector />
            </TimelineSeparator>
            <TimelineContent>
              <Typography variant="subtitle2" className="text-text-primary">
                Perfil
              </Typography>
              <Typography variant="body2" className="line-clamp-1 text-text-secondary">
                Visualização do perfil do usuário.
              </Typography>
              <Typography variant="body2" className="text-text-disabled">
                —
              </Typography>
            </TimelineContent>
          </TimelineItem>
        </Timeline>
      </CardContent>
    </Card>
  );
}
