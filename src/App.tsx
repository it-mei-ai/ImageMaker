import { useCallback, useEffect, useRef, useState } from "react";
import {
  Download,
  ImagePlus,
  LayoutTemplate,
  Palette,
  Plus,
  Sparkles,
  Trash2,
  Type,
  WandSparkles
} from "lucide-react";
import "./styles.css";

type Format = "portrait" | "landscape";

type UploadedImage = {
  id: string;
  name: string;
  src: string;
};

const formats: Record<Format, { label: string; width: number; height: number }> = {
  portrait: { label: "9:16", width: 1080, height: 1920 },
  landscape: { label: "16:9", width: 1920, height: 1080 }
};

const defaultFavorites = ["#ff5c8a", "#ffcf33", "#00bcd4", "#4f46e5", "#22c55e", "#ffffff"];

const loadCanvasImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

const drawCoverImage = (
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  const ratio = Math.max(width / image.width, height / image.height);
  const sourceWidth = width / ratio;
  const sourceHeight = height / ratio;
  const sourceX = (image.width - sourceWidth) / 2;
  const sourceY = (image.height - sourceHeight) / 2;
  ctx.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
};

const wrapText = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  const lines: string[] = [];
  let line = "";
  for (const char of text) {
    const nextLine = line + char;
    if (ctx.measureText(nextLine).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = nextLine;
    }
  }
  if (line) lines.push(line);
  return lines;
};

const makeCopy = (prompt: string) => {
  const compact = prompt.replace(/\s+/g, " ").trim();
  if (!compact) return { headline: "", subline: "" };
  const fragments = compact.split(/[。！？!?、,\n]/).map((part) => part.trim()).filter(Boolean);
  const base = fragments[0] || compact;
  return {
    headline: base.length > 16 ? `${base.slice(0, 16)}...` : base,
    subline: fragments[1]?.slice(0, 18) || "今日の一歩が未来を変える"
  };
};

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [format, setFormat] = useState<Format>("portrait");
  const [baseColor, setBaseColor] = useState("#ff5c8a");
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = window.localStorage.getItem("creative-color-favorites");
    return saved ? (JSON.parse(saved) as string[]) : defaultFavorites;
  });
  const [prompt, setPrompt] = useState("AIで集客投稿をもっと楽しく作る");
  const [headline, setHeadline] = useState("AI集客を楽しく");
  const [subline, setSubline] = useState("今日から投稿が変わる");
  const [images, setImages] = useState<UploadedImage[]>([]);

  const addFavorite = () => {
    setFavorites((current) => {
      const next = [baseColor, ...current.filter((color) => color.toLowerCase() !== baseColor.toLowerCase())].slice(0, 10);
      window.localStorage.setItem("creative-color-favorites", JSON.stringify(next));
      return next;
    });
  };

  const removeFavorite = (color: string) => {
    setFavorites((current) => {
      const next = current.filter((item) => item !== color);
      window.localStorage.setItem("creative-color-favorites", JSON.stringify(next));
      return next;
    });
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files) return;
    const selected = Array.from(files).slice(0, Math.max(0, 3 - images.length));
    const nextImages = await Promise.all(
      selected.map(
        (file) =>
          new Promise<UploadedImage>((resolve) => {
            const reader = new FileReader();
            reader.onload = () =>
              resolve({
                id: `${file.name}-${crypto.randomUUID()}`,
                name: file.name,
                src: String(reader.result)
              });
            reader.readAsDataURL(file);
          })
      )
    );
    setImages((current) => [...current, ...nextImages].slice(0, 3));
  };

  const renderCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = formats[format];
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gradient = ctx.createLinearGradient(0, 0, size.width, size.height);
    gradient.addColorStop(0, "#fff7fb");
    gradient.addColorStop(0.45, baseColor);
    gradient.addColorStop(1, "#f8fff4");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size.width, size.height);

    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = format === "portrait" ? 18 : 12;
    for (let x = -size.height; x < size.width + size.height; x += 160) {
      ctx.beginPath();
      ctx.moveTo(x, size.height);
      ctx.lineTo(x + size.height, 0);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    const loadedImages = await Promise.all(images.map((image) => loadCanvasImage(image.src)));
    const imageArea = format === "portrait"
      ? { x: 96, y: 164, width: 888, height: 720 }
      : { x: 1080, y: 120, width: 690, height: 840 };
    loadedImages.forEach((image, index) => {
      const offset = index * 34;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(imageArea.x + offset, imageArea.y + offset, imageArea.width, imageArea.height, 42);
      ctx.clip();
      drawCoverImage(ctx, image, imageArea.x + offset, imageArea.y + offset, imageArea.width, imageArea.height);
      ctx.restore();
    });

    ctx.fillStyle = "rgba(255,255,255,0.9)";
    const textBox = format === "portrait" ? { x: 86, y: 1010, width: 908, height: 650 } : { x: 110, y: 170, width: 820, height: 700 };
    ctx.beginPath();
    ctx.roundRect(textBox.x, textBox.y, textBox.width, textBox.height, 44);
    ctx.fill();

    ctx.fillStyle = "#152238";
    ctx.font = `900 ${format === "portrait" ? 116 : 96}px sans-serif`;
    const headlineLines = wrapText(ctx, headline, textBox.width - 120).slice(0, 3);
    headlineLines.forEach((line, index) => ctx.fillText(line, textBox.x + 60, textBox.y + 145 + index * 130));

    ctx.fillStyle = "#475569";
    ctx.font = `800 ${format === "portrait" ? 46 : 38}px sans-serif`;
    wrapText(ctx, subline, textBox.width - 120).slice(0, 2).forEach((line, index) => {
      ctx.fillText(line, textBox.x + 60, textBox.y + textBox.height - 120 + index * 54);
    });
  }, [baseColor, format, headline, images, subline]);

  useEffect(() => {
    void renderCanvas();
  }, [renderCanvas]);

  const applyPrompt = () => {
    const copy = makeCopy(prompt);
    setHeadline(copy.headline);
    setSubline(copy.subline);
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const anchor = document.createElement("a");
    anchor.download = `sns-post-${formats[format].label.replace(":", "x")}.png`;
    anchor.href = canvas.toDataURL("image/png");
    anchor.click();
  };

  return (
    <main className="app-shell">
      <section className="workbench">
        <aside className="control-pane">
          <div className="brand">
            <span className="brand-mark">
              <Sparkles size={26} />
            </span>
            <div>
              <p className="eyebrow">Creative Builder</p>
              <h1>SNS投稿画像メーカー</h1>
            </div>
          </div>

          <section className="panel">
            <div className="panel-title">
              <LayoutTemplate size={18} />
              <h2>サイズ</h2>
            </div>
            <div className="segmented">
              {Object.entries(formats).map(([key, size]) => (
                <button key={key} type="button" className={format === key ? "active" : ""} onClick={() => setFormat(key as Format)}>
                  <strong>{size.label}</strong>
                  <span>{size.width} x {size.height}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-title">
              <Palette size={18} />
              <h2>カラー</h2>
            </div>
            <div className="color-row">
              <input value={baseColor} onChange={(event) => setBaseColor(event.target.value)} />
              <input type="color" value={baseColor} onChange={(event) => setBaseColor(event.target.value)} />
              <button type="button" className="icon-button" onClick={addFavorite} aria-label="色を保存">
                <Plus size={18} />
              </button>
            </div>
            <div className="swatches">
              {favorites.map((color) => (
                <button
                  key={color}
                  type="button"
                  className="swatch"
                  style={{ background: color }}
                  onClick={() => setBaseColor(color)}
                  onDoubleClick={() => removeFavorite(color)}
                  aria-label={`${color}を選択`}
                />
              ))}
            </div>
          </section>

          <section className="panel">
            <div className="panel-title">
              <ImagePlus size={18} />
              <h2>画像</h2>
            </div>
            <label className="upload-box">
              <ImagePlus size={24} />
              画像を追加
              <input type="file" accept="image/*" multiple onChange={(event) => void handleImageUpload(event.target.files)} />
            </label>
            <div className="image-list">
              {images.length ? images.map((image) => (
                <div key={image.id} className="image-chip">
                  <img src={image.src} alt="" />
                  <span>{image.name}</span>
                  <button type="button" className="mini-button" onClick={() => setImages((current) => current.filter((item) => item.id !== image.id))}>
                    <Trash2 size={16} />
                  </button>
                </div>
              )) : <span className="empty-state">画像なしでも生成できます</span>}
            </div>
          </section>

          <section className="panel">
            <div className="panel-title">
              <Type size={18} />
              <h2>テキスト</h2>
            </div>
            <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
            <button type="button" className="download-button" onClick={applyPrompt}>
              <WandSparkles size={18} />
              文言を反映
            </button>
            <div className="text-fields">
              <input value={headline} onChange={(event) => setHeadline(event.target.value)} />
              <input value={subline} onChange={(event) => setSubline(event.target.value)} />
            </div>
          </section>

          <button type="button" className="download-button" onClick={downloadImage}>
            <Download size={18} />
            PNGダウンロード
          </button>
        </aside>

        <section className={`preview-pane ${format}`}>
          <div className="preview-top">
            <div>
              <p className="eyebrow">Preview</p>
              <h2>投稿画像プレビュー</h2>
            </div>
            <span className="sparkle-note">
              <Sparkles size={16} />
              画像・色・文言を調整できます
            </span>
          </div>
          <div className="canvas-stage">
            <canvas ref={canvasRef} aria-label="生成画像プレビュー" />
          </div>
        </section>
      </section>
    </main>
  );
}

export default App;
