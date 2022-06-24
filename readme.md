# AEM Grid with true css grid

## How to use

1. Install the [grid.zip](https://github.com/Tylopilus/aem-grid/blob/master/grid.zip) package on your author environment
2. install aem grid npm package with `npm install aem-grid`
3. In your main.scss file, add the following line:

```scss
@import 'aem-grid';

// define breakpoints
$breakpoints: (
  'phone': 650px,
  'tablet': 1200px,
);
// define columns
$columns: 12;
// define gutter padding
$gutter: 16px;
// define if mobile should inherit desktop adjustments
$mobile-inherit: false;

@include aem-Grid(12, 16px, $breakpoints, $mobile-inherit);
```
