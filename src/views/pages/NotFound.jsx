import { Box, Button, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#F5F9FE",
        px: 3,
        textAlign: "center",
      }}
    >
      <Box>
        <Typography
          sx={{
            fontSize: {
              xs: "5rem",
              md: "8rem",
            },
            fontWeight: 900,
            lineHeight: 1,
            color: "#0f766e",
          }}
        >
          404
        </Typography>

        <Typography
          sx={{
            mt: 2,
            fontSize: {
              xs: "1.5rem",
              md: "2rem",
            },
            fontWeight: 800,
            color: "#000000",
          }}
        >
          Page Not Found
        </Typography>

        <Typography
          sx={{
            mt: 1,
            color: "#64748B",
            maxWidth: 500,
          }}
        >
          The page you are looking for doesn't exist
          or may have been moved.
        </Typography>

        <Button
          onClick={() => navigate("/")}
          startIcon={<HomeRoundedIcon />}
          variant="contained"
          sx={{
            mt: 4,
            px: 3,
            py: 1.3,
            borderRadius: "10px",
            background: "#0f766e",
            textTransform: "none",
            fontWeight: 800,
            "&:hover": {
              background: "#0b5f59",
            },
          }}
        >
          Back to Home
        </Button>
      </Box>
    </Box>
  );
};

export default NotFound;