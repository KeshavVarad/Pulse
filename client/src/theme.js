import { createTheme } from '@mui/material/styles';
import '@fontsource/lato'


const theme = createTheme({
  palette: {
    primary: {
      main: '#27A599',
      light: '#cbf3f0',
      dark: '#239589',
      contrastText: '#fff',
    },
    secondary:{
        main:'#FF9F1C',
    }
  },
  typography:{
    fontFamily: '"Lato", sans-serif;',
    h1: {
      fontFamily: '"Lato", sans-serif;',
      fontWeight: 700,
      fontSize: '4rem',
    },
    h2: {
      fontFamily: '"Lato", sans-serif;',
      fontWeight: 400,
      fontSize: '2.5rem',
    },
    h3: {
      fontFamily: '"Lato", sans-serif;',
      fontWeight: 400,
      fontSize: '2.25rem',
    },
    h4: {
      fontFamily: '"Lato", sans-serif;',
      fontWeight: 400,
      fontSize: '2rem',
    },
    h4: {
      fontFamily: '"Lato", sans-serif;',
      fontWeight: 300,
      fontSize: '1rem',
    },
  }
});

export default theme;