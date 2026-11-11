# Okto landing page

## Rive outfit anchor

`src/components/OktoRive.tsx` positions the explorer-hat SVG within the Rive canvas wrapper, never in page coordinates. Tune its fixed, canvas-relative anchor in `src/styles/tokens.css`:

```css
--okto-outfit-anchor-x: 50%;
--okto-outfit-anchor-y: 28%;
--okto-outfit-anchor-width: 38%;
```

`x` and `y` locate the SVG centre as a percentage of the Okti canvas. `width` controls its size.

## App-screen replacements

Drop the final WebP exports into `public/screens/` using these names. The landing page automatically swaps each placeholder when its file is available:

- `follow-money-route-en.webp`
- `daily-streak-en.webp`
- `savings-jar-en.webp`
- `souq-en.webp`

Use the matching `-ar.webp` variant when Arabic screen switching is added in the next content pass.
