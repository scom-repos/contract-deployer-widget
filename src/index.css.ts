import { Styles } from "@ijstech/components";

export default Styles.style({
  $nest: {
    'textarea': {
      border: 'none',
      outline: 'none'
    },
    '.preview-wrap': {
      whiteSpace: 'pre-wrap'
    },
    '.prevent-select': {
      userSelect: 'none',
      "-webkit-user-select": "none"
    }
  }
})