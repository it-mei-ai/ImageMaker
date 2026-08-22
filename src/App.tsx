import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Download,
  Eye,
  EyeOff,
  GalleryHorizontalEnd,
  ImagePlus,
  LayoutTemplate,
  Palette,
  Plus,
  Sparkles,
  Trash2,
  Type,
  WandSparkles
} from "lucide-react";
import floralOrangeTemplate from "./assets/templates/floral-orange.jpg";
import floralPinkTemplate from "./assets/templates/floral-pink.jpg";
import template2 from "./assets/templates/template-2.jpg";
import template3 from "./assets/templates/template-3.jpg";
import template4 from "./assets/templates/template-4.jpg";
import template5 from "./assets/templates/template-5.jpg";
import template6 from "./assets/templates/template-6.jpg";
import template7 from "./assets/templates/template-7.jpg";
import template8 from "./assets/templates/template-8.jpg";
import template9 from "./assets/templates/template-9.jpg";
import template10 from "./assets/templates/template-10.jpg";
import template11 from "./assets/templates/template-11.jpg";
import template12 from "./assets/templates/template-12.jpg";
import "./styles.css";

type Format = "portrait" | "landscape";
type AutoPattern = "diagonal" | "sparkle" | "circuit" | "rays";
type TextAlign = "left" | "center" | "right";

type UploadedImage = {
  id: string;
  name: string;
  src: string;
};

type BackgroundTemplate = UploadedImage & {
  source: "built-in" | "custom";
};

type BoxSettings = {
  width: number;
  height: number;
  top: number;
  right: number;
  bottom: number;
  left: number;
};

type TextSettings = BoxSettings & {
  color: string;
  fontSize: number;
  align: TextAlign;
};

const formats: Record<Format, { label: string; width: number; height: number }> = {
  portrait: { label: "9:16", width: 1080, height: 1920 },
  landscape: { label: "16:9", width: 1920, height: 1080 }
};

const defaultFavorites = ["#ff5c8a", "#ffcf33", "#00bcd4", "#4f46e5", "#22c55e", "#ffffff"];
const CUSTOM_TEMPLATES_KEY = "imagemaker-custom-templates";

const autoPatterns: Record<AutoPattern, string> = {
  diagonal: "斜めライン",
  sparkle: "キラキラ",
  circuit: "回路線",
  rays: "放射ライン"
};

const getDefaultImageBox = (format: Format): BoxSettings => {
  if (format === "portrait") {
    return { width: 888, height: 720, top: 164, right: 96, bottom: 1036, left: 96 };
  }
  return { width: 690, height: 840, top: 120, right: 150, bottom: 120, left: 1080 };
};

const getDefaultHeadlineBox = (format: Format): TextSettings => {
  if (format === "portrait") {
    return { width: 908, height: 300, top: 1010, right: 86, bottom: 610, left: 86, color: "#152238", fontSize: 116, align: "left" };
  }
  return { width: 820, height: 320, top: 170, right: 990, bottom: 590, left: 110, color: "#152238", fontSize: 96, align: "left" };
};

const getDefaultBodyBox = (format: Format): TextSettings => {
  if (format === "portrait") {
    return { width: 908, height: 180, top: 1480, right: 86, bottom: 260, left: 86, color: "#475569", fontSize: 46, align: "left" };
  }
  return { width: 820, height: 180, top: 660, right: 990, bottom: 240, left: 110, color: "#475569", fontSize: 38, align: "left" };
};

const builtInTemplates: BackgroundTemplate[] = [
  { id: "built-in-floral-pink", name: "ピンクフラワー", src: floralPinkTemplate, source: "built-in" },
  { id: "built-in-floral-orange", name: "オレンジフラワー", src: floralOrangeTemplate, source: "built-in" },
  { id: "built-in-template-2", name: "花フレーム ピンク", src: template2, source: "built-in" },
  { id: "built-in-template-3", name: "花フレーム オレンジ", src: template3, source: "built-in" },
  { id: "built-in-template-4", name: "勉強会 開催したよ", src: template4, source: "built-in" },
  { id: "built-in-template-5", name: "勉強会 開催するよ", src: template5, source: "built-in" },
  { id: "built-in-template-6", name: "業務効率化 AI", src: template6, source: "built-in" },
  { id: "built-in-template-7", name: "業務効率化 グリーン", src: template7, source: "built-in" },
  { id: "built-in-template-8", name: "業務効率化 イエロー", src: template8, source: "built-in" },
  { id: "built-in-template-9", name: "ペライチ制作事例", src: template9, source: "built-in" },
  { id: "built-in-template-10", name: "花ライン ピンク", src: template10, source: "built-in" },
  { id: "built-in-template-11", name: "花ライン オレンジ", src: template11, source: "built-in" },
  { id: "built-in-template-12", name: "回路ライン イエロー", src: template12, source: "built-in" }
];

const safeJsonParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const saveCustomTemplates = (templates: BackgroundTemplate[]) => {
  window.localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
};

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

const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const getRight = (box: BoxSettings, format: Format) => Math.max(0, formats[format].width - box.left - box.width);
const getBottom = (box: BoxSettings, format: Format) => Math.max(0, formats[format].height - box.top - box.height);

const fitBoxToFormat = <T extends BoxSettings>(box: T, format: Format): T => {
  const size = formats[format];
  const left = clampNumber(box.left, 0, size.width - 1);
  const top = clampNumber(box.top, 0, size.height - 1);
  const width = clampNumber(box.width, 1, size.width - left);
  const height = clampNumber(box.height, 1, size.height - top);
  return { ...box, left, top, width, height, right: getRight({ ...box, left, width }, format), bottom: getBottom({ ...box, top, height }, format) };
};

const drawAutoPattern = (
  ctx: CanvasRenderingContext2D,
  pattern: AutoPattern,
  size: { width: number; height: number },
  format: Format
) => {
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = format === "portrait" ? 18 : 12;

  if (pattern === "diagonal") {
    for (let x = -size.height; x < size.width + size.height; x += 160) {
      ctx.beginPath();
      ctx.moveTo(x, size.height);
      ctx.lineTo(x + size.height, 0);
      ctx.stroke();
    }
  }

  if (pattern === "sparkle") {
    for (let i = 0; i < 34; i += 1) {
      const x = (i * 173) % size.width;
      const y = (i * 251) % size.height;
      const radius = format === "portrait" ? 18 + (i % 4) * 8 : 14 + (i % 4) * 6;
      ctx.beginPath();
      ctx.moveTo(x, y - radius);
      ctx.lineTo(x + radius * 0.32, y - radius * 0.32);
      ctx.lineTo(x + radius, y);
      ctx.lineTo(x + radius * 0.32, y + radius * 0.32);
      ctx.lineTo(x, y + radius);
      ctx.lineTo(x - radius * 0.32, y + radius * 0.32);
      ctx.lineTo(x - radius, y);
      ctx.lineTo(x - radius * 0.32, y - radius * 0.32);
      ctx.closePath();
      ctx.fill();
    }
  }

  if (pattern === "circuit") {
    ctx.lineWidth = format === "portrait" ? 7 : 5;
    for (let y = 110; y < size.height; y += 210) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      for (let x = 0; x < size.width; x += 180) {
        ctx.lineTo(x + 70, y);
        ctx.lineTo(x + 70, y + 58);
        ctx.lineTo(x + 150, y + 58);
      }
      ctx.stroke();
    }
    for (let i = 0; i < 24; i += 1) {
      ctx.beginPath();
      ctx.arc((i * 199) % size.width, (i * 263) % size.height, 9, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  if (pattern === "rays") {
    const centerX = size.width * 0.5;
    const centerY = size.height * 0.42;
    ctx.lineWidth = format === "portrait" ? 12 : 8;
    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 18) {
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(angle) * size.height, centerY + Math.sin(angle) * size.height);
      ctx.stroke();
    }
  }

  ctx.restore();
};

const drawTextBlock = (
  ctx: CanvasRenderingContext2D,
  text: string,
  settings: TextSettings,
  weight: number
) => {
  if (!text.trim()) return;
  const lineHeight = Math.round(settings.fontSize * 1.14);
  ctx.save();
  ctx.font = `${weight} ${settings.fontSize}px sans-serif`;
  ctx.textAlign = settings.align;
  ctx.textBaseline = "top";
  ctx.lineJoin = "round";
  ctx.fillStyle = settings.color;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = Math.max(6, settings.fontSize * 0.11);
  ctx.shadowColor = "rgba(15, 23, 42, 0.28)";
  ctx.shadowBlur = Math.max(10, settings.fontSize * 0.12);
  ctx.shadowOffsetY = Math.max(4, settings.fontSize * 0.05);

  const maxLines = Math.max(1, Math.floor(settings.height / lineHeight));
  const lines = wrapText(ctx, text, settings.width).slice(0, maxLines);
  const x = settings.align === "center"
    ? settings.left + settings.width / 2
    : settings.align === "right"
      ? settings.left + settings.width
      : settings.left;
  lines.forEach((line, index) => {
    const y = settings.top + index * lineHeight;
    ctx.strokeText(line, x, y);
    ctx.fillText(line, x, y);
  });
  ctx.restore();
};

const readImageFile = (file: File) =>
  new Promise<UploadedImage>((resolve) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        id: `${file.name}-${crypto.randomUUID()}`,
        name: file.name,
        src: String(reader.result)
      });
    reader.readAsDataURL(file);
  });

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
    return safeJsonParse(saved, defaultFavorites);
  });
  const [customTemplates, setCustomTemplates] = useState<BackgroundTemplate[]>(() =>
    safeJsonParse(window.localStorage.getItem(CUSTOM_TEMPLATES_KEY), [])
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState("auto");
  const [autoPattern, setAutoPattern] = useState<AutoPattern>("diagonal");
  const [prompt, setPrompt] = useState("AIで集客投稿をもっと楽しく作る");
  const [headline, setHeadline] = useState("AI集客を楽しく");
  const [subline, setSubline] = useState("今日から投稿が変わる");
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [imageBox, setImageBox] = useState<BoxSettings>(() => getDefaultImageBox("portrait"));
  const [headlineSettings, setHeadlineSettings] = useState<TextSettings>(() => getDefaultHeadlineBox("portrait"));
  const [bodySettings, setBodySettings] = useState<TextSettings>(() => getDefaultBodyBox("portrait"));
  const [showHiddenAreaGuide, setShowHiddenAreaGuide] = useState(false);

  const backgroundTemplates = useMemo(
    () => [...builtInTemplates, ...customTemplates],
    [customTemplates]
  );
  const selectedTemplate = backgroundTemplates.find((template) => template.id === selectedTemplateId);

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
    const nextImages = await Promise.all(selected.map(readImageFile));
    setImages((current) => [...current, ...nextImages].slice(0, 3));
  };

  const handleTemplateUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const nextTemplates = (await Promise.all(Array.from(files).slice(0, 4).map(readImageFile)))
      .map((image) => ({ ...image, source: "custom" as const }));
    setCustomTemplates((current) => {
      const next = [...nextTemplates, ...current].slice(0, 10);
      saveCustomTemplates(next);
      setSelectedTemplateId(nextTemplates[0]?.id || selectedTemplateId);
      return next;
    });
  };

  const removeCustomTemplate = (id: string) => {
    setCustomTemplates((current) => {
      const next = current.filter((template) => template.id !== id);
      saveCustomTemplates(next);
      if (selectedTemplateId === id) setSelectedTemplateId("auto");
      return next;
    });
  };

  const handleFormatChange = (nextFormat: Format) => {
    setFormat(nextFormat);
    setImageBox(getDefaultImageBox(nextFormat));
    setHeadlineSettings(getDefaultHeadlineBox(nextFormat));
    setBodySettings(getDefaultBodyBox(nextFormat));
  };

  const updateBox = <T extends BoxSettings>(
    setter: Dispatch<SetStateAction<T>>,
    key: keyof BoxSettings,
    value: number
  ) => {
    setter((current) => {
      const size = formats[format];
      const next = { ...current };
      if (key === "right") {
        next.width = clampNumber(size.width - current.left - value, 1, size.width - current.left);
      } else if (key === "bottom") {
        next.height = clampNumber(size.height - current.top - value, 1, size.height - current.top);
      } else {
        next[key] = value;
      }
      return fitBoxToFormat(next, format);
    });
  };

  const updateTextSetting = (
    setter: Dispatch<SetStateAction<TextSettings>>,
    key: keyof TextSettings,
    value: string | number
  ) => {
    setter((current) => ({ ...current, [key]: value }));
  };

  const resetLayout = () => {
    setImageBox(getDefaultImageBox(format));
    setHeadlineSettings(getDefaultHeadlineBox(format));
    setBodySettings(getDefaultBodyBox(format));
  };

  const renderCanvas = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const size = formats[format];
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (selectedTemplate) {
      const backgroundImage = await loadCanvasImage(selectedTemplate.src);
      drawCoverImage(ctx, backgroundImage, 0, 0, size.width, size.height);
    } else {
      const gradient = ctx.createLinearGradient(0, 0, size.width, size.height);
      gradient.addColorStop(0, "#fff7fb");
      gradient.addColorStop(0.45, baseColor);
      gradient.addColorStop(1, "#f8fff4");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size.width, size.height);
      drawAutoPattern(ctx, autoPattern, size, format);
    }

    const loadedImages = await Promise.all(images.map((image) => loadCanvasImage(image.src)));
    loadedImages.forEach((image, index) => {
      const offset = index * 34;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(imageBox.left + offset, imageBox.top + offset, imageBox.width, imageBox.height, 42);
      ctx.clip();
      drawCoverImage(ctx, image, imageBox.left + offset, imageBox.top + offset, imageBox.width, imageBox.height);
      ctx.restore();
    });

    drawTextBlock(ctx, headline, headlineSettings, 900);
    drawTextBlock(ctx, subline, bodySettings, 800);
  }, [autoPattern, baseColor, bodySettings, format, headline, headlineSettings, imageBox, images, selectedTemplate, subline]);

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

  const renderBoxControls = <T extends BoxSettings>(
    box: T,
    setter: Dispatch<SetStateAction<T>>
  ) => (
    <div className="metric-grid">
      {([
        ["width", "横幅"],
        ["height", "縦幅"],
        ["top", "上余白"],
        ["right", "右余白"],
        ["bottom", "下余白"],
        ["left", "左余白"]
      ] as [keyof BoxSettings, string][]).map(([key, label]) => (
        <label key={key} className="metric-field">
          <span>{label}</span>
          <input
            type="number"
            min="0"
            value={key === "right" ? getRight(box, format) : key === "bottom" ? getBottom(box, format) : box[key]}
            onChange={(event) => updateBox(setter, key, Number(event.target.value))}
          />
        </label>
      ))}
    </div>
  );

  const renderAlignButtons = (
    settings: TextSettings,
    setter: Dispatch<SetStateAction<TextSettings>>
  ) => (
    <div className="align-buttons" aria-label="文字揃え">
      {([
        ["left", AlignLeft],
        ["center", AlignCenter],
        ["right", AlignRight]
      ] as [TextAlign, typeof AlignLeft][]).map(([align, Icon]) => (
        <button
          key={align}
          type="button"
          className={settings.align === align ? "active" : ""}
          onClick={() => updateTextSetting(setter, "align", align)}
          aria-label={`${align}に揃える`}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );

  const renderTextControls = (
    text: string,
    setText: Dispatch<SetStateAction<string>>,
    settings: TextSettings,
    setter: Dispatch<SetStateAction<TextSettings>>,
    label: string
  ) => (
    <div className="text-editor">
      <label className="field-label">
        <span>{label}</span>
        <input value={text} onChange={(event) => setText(event.target.value)} />
      </label>
      <div className="text-option-row">
        {renderAlignButtons(settings, setter)}
        <label className="color-mini">
          <span>文字色</span>
          <input value={settings.color} onChange={(event) => updateTextSetting(setter, "color", event.target.value)} />
          <input type="color" value={settings.color} onChange={(event) => updateTextSetting(setter, "color", event.target.value)} />
        </label>
        <label className="metric-field font-size-field">
          <span>サイズ</span>
          <input
            type="number"
            min="12"
            max="220"
            value={settings.fontSize}
            onChange={(event) => updateTextSetting(setter, "fontSize", Number(event.target.value))}
          />
        </label>
      </div>
      {renderBoxControls(settings, setter)}
    </div>
  );

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
                <button key={key} type="button" className={format === key ? "active" : ""} onClick={() => handleFormatChange(key as Format)}>
                  <strong>{size.label}</strong>
                  <span>{size.width} x {size.height}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className={`guide-toggle ${showHiddenAreaGuide ? "active" : ""}`}
              onClick={() => setShowHiddenAreaGuide((current) => !current)}
            >
              {showHiddenAreaGuide ? <Eye size={17} /> : <EyeOff size={17} />}
              <span>テキスト非表示エリア</span>
              <strong>{showHiddenAreaGuide ? "表示中" : "非表示"}</strong>
            </button>
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
              <GalleryHorizontalEnd size={18} />
              <h2>背景テンプレート</h2>
            </div>
            <div className="template-grid">
              <button
                type="button"
                className={`template-card auto-template ${selectedTemplateId === "auto" ? "active" : ""}`}
                onClick={() => setSelectedTemplateId("auto")}
              >
                <span className="auto-preview" style={{ background: `linear-gradient(135deg, #fff7fb, ${baseColor}, #f8fff4)` }} />
                <strong>自動背景</strong>
              </button>
              {backgroundTemplates.map((template) => (
                <div key={template.id} className={`template-card-wrap ${selectedTemplateId === template.id ? "active" : ""}`}>
                  <button type="button" className="template-card" onClick={() => setSelectedTemplateId(template.id)}>
                    <img src={template.src} alt="" />
                    <strong>{template.name}</strong>
                  </button>
                  {template.source === "custom" && (
                    <button
                      type="button"
                      className="template-delete"
                      aria-label={`${template.name}を削除`}
                      onClick={() => removeCustomTemplate(template.id)}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="pattern-row">
              {Object.entries(autoPatterns).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  className={autoPattern === key ? "active" : ""}
                  onClick={() => {
                    setSelectedTemplateId("auto");
                    setAutoPattern(key as AutoPattern);
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="template-upload">
              <ImagePlus size={18} />
              マイテンプレート追加
              <input type="file" accept="image/*" multiple onChange={(event) => {
                void handleTemplateUpload(event.target.files);
                event.currentTarget.value = "";
              }} />
            </label>
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
            <div className="sub-panel">
              <div className="sub-panel-title">
                <strong>画像配置</strong>
                <button type="button" onClick={() => setImageBox(getDefaultImageBox(format))}>初期値</button>
              </div>
              {renderBoxControls(imageBox, setImageBox)}
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
            <div className="text-editor-stack">
              {renderTextControls(headline, setHeadline, headlineSettings, setHeadlineSettings, "テキスト1（キャッチコピー）")}
              {renderTextControls(subline, setSubline, bodySettings, setBodySettings, "テキスト2（ボディコピー）")}
              <button type="button" className="reset-layout-button" onClick={resetLayout}>配置を初期値に戻す</button>
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
            <div className="canvas-frame">
              <canvas ref={canvasRef} aria-label="生成画像プレビュー" />
              {showHiddenAreaGuide && format === "portrait" && (
                <div className="hidden-area-guide" aria-hidden="true">
                  <div className="hidden-band top">非表示エリア</div>
                  <div className="safe-band" />
                  <div className="hidden-band bottom">非表示エリア</div>
                </div>
              )}
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

export default App;
