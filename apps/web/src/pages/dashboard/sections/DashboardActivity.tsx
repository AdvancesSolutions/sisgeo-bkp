import { Link } from "react-router-dom";

import Timeline from "@mui/lab/Timeline";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import { Card, CardContent, Typography } from "@mui/material";

export default function DashboardActivity() {
  return (
    <>
      <Typography variant="h6" component="h6" className="mt-2 mb-3">
        Atividade
      </Typography>

      <Card>
        <CardContent className="pe-0! pt-0!">
          <Timeline className="h-139 items-start overflow-auto">
            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot color="info" variant="outlined" />
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="subtitle2" className="text-text-primary">
                  Tarefa atualizada
                </Typography>
                <Typography variant="body2" className="text-text-secondary line-clamp-1">
                  Status alterado para{" "}
                  <Link to="/tasks" className="link-text-secondary">
                    Concluída
                  </Link>
                </Typography>
                <Typography variant="body2" className="text-text-disabled">
                  Há 4 horas
                </Typography>
              </TimelineContent>
            </TimelineItem>

            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot color="success" variant="outlined" />
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="subtitle2" className="text-text-primary">
                  Login
                </Typography>
                <Typography variant="body2" className="text-text-secondary line-clamp-1">
                  Usuário acessou o painel.
                </Typography>
                <Typography variant="body2" className="text-text-disabled">
                  Há 4 horas
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
                  Nova tarefa
                </Typography>
                <Typography variant="body2" className="text-text-secondary line-clamp-1">
                  Tarefa criada em{" "}
                  <Link to="/tasks" className="link-text-secondary">
                    Área Centro
                  </Link>
                </Typography>
                <Typography variant="body2" className="text-text-disabled">
                  Há 6 horas
                </Typography>
              </TimelineContent>
            </TimelineItem>

            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot color="warning" variant="outlined" />
                <TimelineConnector />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="subtitle2" className="text-text-primary">
                  Validação
                </Typography>
                <Typography variant="body2" className="text-text-secondary line-clamp-1">
                  Tarefa enviada para{" "}
                  <Link to="/validation" className="link-text-secondary">
                    validação
                  </Link>
                </Typography>
                <Typography variant="body2" className="text-text-disabled">
                  Há 2 dias
                </Typography>
              </TimelineContent>
            </TimelineItem>

            <TimelineItem>
              <TimelineSeparator>
                <TimelineDot color="success" variant="outlined" />
              </TimelineSeparator>
              <TimelineContent>
                <Typography variant="subtitle2" className="text-text-primary">
                  Ponto registrado
                </Typography>
                <Typography variant="body2" className="text-text-secondary line-clamp-1">
                  Entrada registrada em <Link to="/time-clock" className="link-text-secondary">Ponto</Link>.
                </Typography>
                <Typography variant="body2" className="text-text-disabled">
                  Há 3 dias
                </Typography>
              </TimelineContent>
            </TimelineItem>
          </Timeline>
        </CardContent>
      </Card>
    </>
  );
}
