// Renders a small 0/1 matrix as crisp square "pixels" using CSS grid.
// All icons in this app are generated this way — no image files.
export default function PixelIcon({ matrix, size = 2, color = "currentColor", className }) {
  const cols = matrix[0]?.length || 0;
  return (
    <div
      className={className}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, ${size}px)`,
        gap: 0,
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {matrix.map((row, r) =>
        row.map((cell, c) => (
          <span
            key={`${r}-${c}`}
            style={{
              width: size,
              height: size,
              background: cell ? color : "transparent",
            }}
          />
        ))
      )}
    </div>
  );
}
