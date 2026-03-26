import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  Container,
  CssBaseline,
  Toolbar,
  Typography,
  Button,
  ThemeProvider,
  createTheme
} from '@mui/material';
import VideoIcon from '@mui/icons-material/VideoLibrary';
import AddIcon from '@mui/icons-material/Add';
import ScheduleIcon from '@mui/icons-material/Schedule';
import BarChartIcon from '@mui/icons-material/BarChart';
import PublishIcon from '@mui/icons-material/Publish';
import ScienceIcon from '@mui/icons-material/Science';
import PsychologyAltIcon from '@mui/icons-material/PsychologyAlt';
import BusinessIcon from '@mui/icons-material/Business';
import BuildIcon from '@mui/icons-material/Build';
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';

interface LayoutProps {
  children: React.ReactNode;
}

const routePreloaders: Record<string, () => Promise<unknown>> = {
  "/publish": () => import("../pages/PublishDashboard"),
  "/analytics": () => import("../pages/AnalyticsDashboard"),
  "/scheduler": () => import("../pages/SchedulerDashboard"),
  "/ab-testing": () => import("../pages/ABTestingDashboard"),
  "/ai": () => import("../pages/AIDashboard"),
  "/health": () => import("../pages/HealthDashboard"),
  "/tenants": () => import("../pages/TenantConsole"),
  "/content-tools": () => import("../pages/ContentTools"),
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  const preloadRoute = (path: string) => {
    const preload = routePreloaders[path];
    if (preload) {
      void preload();
    }
  };

  const navButtonProps = (path: string) => ({
    onClick: () => navigate(path),
    onMouseEnter: () => preloadRoute(path),
    onFocus: () => preloadRoute(path),
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <AppBar position="static">
          <Toolbar>
            <VideoIcon sx={{ mr: 2 }} />
            <Typography 
              variant="h6" 
              component="div" 
              sx={{ flexGrow: 1, cursor: 'pointer' }}
              onClick={() => navigate('/')}
            >
              Short Video Maker
            </Typography>
            <Button 
              color="inherit" 
              startIcon={<AddIcon />}
              onClick={() => navigate('/create')}
            >
              Create Video
            </Button>
            <Button
              color="inherit"
              startIcon={<PublishIcon />}
              {...navButtonProps('/publish')}
            >
              Publish
            </Button>
            <Button
              color="inherit"
              startIcon={<BarChartIcon />}
              {...navButtonProps('/analytics')}
            >
              Analytics
            </Button>
            <Button
              color="inherit"
              startIcon={<ScheduleIcon />}
              {...navButtonProps('/scheduler')}
            >
              Scheduler
            </Button>
            <Button
              color="inherit"
              startIcon={<ScienceIcon />}
              {...navButtonProps('/ab-testing')}
            >
              A/B Tests
            </Button>
            <Button
              color="inherit"
              startIcon={<PsychologyAltIcon />}
              {...navButtonProps('/ai')}
            >
              AI Monitor
            </Button>
            <Button
              color="inherit"
              startIcon={<MonitorHeartIcon />}
              {...navButtonProps('/health')}
            >
              Health
            </Button>
            <Button
              color="inherit"
              startIcon={<BusinessIcon />}
              {...navButtonProps('/tenants')}
            >
              Tenants
            </Button>
            <Button
              color="inherit"
              startIcon={<BuildIcon />}
              {...navButtonProps('/content-tools')}
            >
              Content Tools
            </Button>
          </Toolbar>
        </AppBar>
        <Container component="main" sx={{ flexGrow: 1, py: 4 }}>
          {children}
        </Container>
        <Box 
          component="footer" 
          sx={{ 
            py: 3, 
            mt: 'auto', 
            backgroundColor: (theme) => theme.palette.grey[200],
            textAlign: 'center'
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Short Video Maker &copy; {new Date().getFullYear()}
          </Typography>
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default Layout; 
