import { definePreset } from '@primevue/themes'
import Aura from '@primevue/themes/aura'

const FlowpipePreset = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '#fef2f3',
      100: '#fde6e8',
      200: '#fbd0d5',
      300: '#f8a9b2',
      400: '#f37a88',
      500: '#EA5160',
      600: '#d62f42',
      700: '#b42236',
      800: '#961f32',
      900: '#7f1f30',
      950: '#460c16',
    },
    colorScheme: {
      light: {
        primary: {
          color:         '#EA5160',
          contrastColor: '#ffffff',
          hoverColor:    '#d62f42',
          activeColor:   '#b42236',
        },
        highlight: {
          background:      '#fde6e8',
          focusBackground: '#fbd0d5',
          color:           '#b42236',
          focusColor:      '#961f32',
        },
      },
      dark: {
        primary: {
          color:         '#EA5160',
          contrastColor: '#ffffff',
          hoverColor:    '#d62f42',
          activeColor:   '#b42236',
        },
        highlight: {
          background:      'rgba(234,81,96,0.2)',
          focusBackground: 'rgba(234,81,96,0.3)',
          color:           '#f8a9b2',
          focusColor:      '#fbd0d5',
        },
      },
    },
  },
  components: {
    dialog: {
      colorScheme: {
        dark: {
          root: {
            background: '#1e1e1e',
            borderColor: '#3a3a3a',
            color: '#e0e0e0',
          },
          header: {
            background: '#1e1e1e',
            color: '#e0e0e0',
          },
          content: {
            background: '#1e1e1e',
            color: '#e0e0e0',
          },
        },
      },
    },
    inputtext: {
      colorScheme: {
        dark: {
          root: {
            background: '#2d2d2d',
            borderColor: '#3d3d3d',
            color: '#cccccc',
            hoverBorderColor: '#EA5160',
            focusBorderColor: '#EA5160',
          },
        },
      },
    },
    button: {
      colorScheme: {
        dark: {
          root: {
            secondaryBackground: '#3a3a3a',
            secondaryBorderColor: '#4a4a4a',
            secondaryColor: '#cccccc',
            secondaryHoverBackground: '#4a4a4a',
          },
        },
      },
    },
  },
})

export default FlowpipePreset
