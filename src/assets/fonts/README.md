For general fonts, this project uses the Oswald font, loaded via Google Fonts and a `link` tag. it isn't bundled with this application.

I want to show bar numbers in the `BarMarkers` component, though, and so I need the font to be loaded in 3D space. For this, I need a JSON representation of the font. So, the json file in this directory only contains number glyphs (0-9), and is only used with Three.js for visualizing bar numbers.
