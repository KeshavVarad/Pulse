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
    },
    red:{
        main:'#f94144',
    },
    green:{
        main:'#90be6d',
    },
    yellow:{
        main:'#f9c74f',
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
      fontWeight: 300,
      fontSize: '2.5rem',
    },
    h4: {
      fontFamily: '"Lato", sans-serif;',
      fontWeight: 300,
      fontSize: '1.5rem',
    },
    h5: {
      fontFamily: '"Lato", sans-serif;',
      fontWeight: 300,
      fontSize: '1rem',
    },
    h6: {
      fontFamily: '"Lato", sans-serif;',
      fontWeight: 400,
      fontSize: '1rem',
      
    },
    h7: {
      fontFamily: '"Lato", sans-serif;',
      fontWeight: 400,
      fontSize: '1rem',
      
    },
  }
});

export default theme;