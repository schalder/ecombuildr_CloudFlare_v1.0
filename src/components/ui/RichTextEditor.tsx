import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Link as LinkIcon,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Undo2,
  Redo2,
  Image as ImageIcon,
  Eraser,
  PaintBucket,
  Palette
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  className?: string;
  placeholder?: string;
};

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  className,
  placeholder,
}) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [imageAlt, setImageAlt] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [textColor, setTextColor] = useState("#000000");
  const [bgColor, setBgColor] = useState("#ffff00");
  const savedSelection = useRef<Range | null>(null);
  const [imageWidthPct, setImageWidthPct] = useState<number>(100);
  const [editingExistingImage, setEditingExistingImage] = useState<boolean>(false);
  const selectedImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    // Keep DOM in sync when outer value changes (e.g., reset)
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  useEffect(() => {
    // Prefer CSS styling for execCommand results, and default paragraphs to <p>
    try {
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("defaultParagraphSeparator", false, "p");
    } catch (_) {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!isImageDialogOpen) return;
    // Restore and inspect current selection to detect selected image
    restoreSelection();
    const range = savedSelection.current;
    if (!range) return;
    let node: Node = range.commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = (node as Text).parentElement as HTMLElement;
    }
    let img: HTMLImageElement | null = null;
    if (node instanceof HTMLElement) {
      if (node.tagName === "IMG") img = node as HTMLImageElement;
      else img = node.closest("img") as HTMLImageElement | null;
    }
    if (img) {
      selectedImageRef.current = img;
      setEditingExistingImage(true);
      setImageUrl(img.getAttribute("src") || "");
      setImageAlt(img.getAttribute("alt") || "");
      const w = (img.style.width || "").trim();
      if (w.endsWith("%")) {
        const n = parseInt(w, 10);
        setImageWidthPct(isNaN(n) ? 100 : n);
      } else {
        setImageWidthPct(100);
      }
    } else {
      selectedImageRef.current = null;
      setEditingExistingImage(false);
      setImageUrl("");
      setImageAlt("");
      setImageWidthPct(100);
    }
  }, [isImageDialogOpen]);

  const getSelectionRange = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      return sel.getRangeAt(0);
    }
    return null;
  };

  const saveSelection = () => {
    const range = getSelectionRange();
    savedSelection.current = range ? range.cloneRange() : null;
  };

  const restoreSelection = () => {
    const range = savedSelection.current;
    if (range) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(range);
      }
    }
  };

  const exec = (command: string, value?: string) => {
    restoreSelection();
    if (editorRef.current) {
      editorRef.current.focus({ preventScroll: true });
    }
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const sanitizeHtml = (input: string): string => {
    const container = document.createElement("div");
    container.innerHTML = input;

    const ALLOWED = new Set([
      "P","BR","STRONG","B","EM","I","U","S",
      "A","H1","H2","H3","H4","H5","H6",
      "UL","OL","LI","BLOCKQUOTE","CODE","PRE",
      "SPAN","IMG","DIV"
    ]);

    const sanitizeElement = (el: Element) => {
      // Remove event handlers and disallowed attributes
      [...el.attributes].forEach(attr => {
        const name = attr.name.toLowerCase();
        if (name.startsWith("on")) {
          el.removeAttribute(attr.name);
        }
      });

      const tag = el.tagName.toUpperCase();
      if (!ALLOWED.has(tag)) {
        // unwrap
        const parent = el.parentNode;
        if (parent) {
          while (el.firstChild) parent.insertBefore(el.firstChild, el);
          parent.removeChild(el);
        }
        return;
      }

      if (tag === "A") {
        const href = (el as HTMLAnchorElement).getAttribute("href") || "";
        if (!/^(https?:|mailto:|tel:)/i.test(href)) {
          el.removeAttribute("href");
        }
        el.setAttribute("rel", "nofollow noopener noreferrer");
        el.setAttribute("target", "_blank");
      }

      if (tag === "IMG") {
        const img = el as HTMLImageElement;
        const src = img.getAttribute("src") || "";
        if (!/^(https?:|data:)/i.test(src)) {
          img.parentElement?.removeChild(img);
          return;
        }
        img.removeAttribute("width");
        img.removeAttribute("height");
        img.style.maxWidth = "100%";
        img.style.height = "auto";
      }

      // Sanitize style
      const style = (el as HTMLElement).getAttribute("style");
      if (style) {
        const allowedStyles = [
          "color",
          "background-color",
          "text-align",
          "font-size",
          "font-weight",
          "font-style",
          "text-decoration",
          "width",
          "max-width",
          "height"
        ];
        const cleaned: Record<string,string> = {};
        style.split(";").forEach(rule => {
          const [prop, val] = rule.split(":");
          if (!prop || !val) return;
          const p = prop.trim().toLowerCase();
          if (allowedStyles.includes(p)) cleaned[p] = val.trim();
        });
        (el as HTMLElement).setAttribute(
          "style",
          Object.entries(cleaned).map(([k,v]) => `${k}: ${v}`).join("; ")
        );
      }
    };

    const treeWalker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT);
    const toProcess: Element[] = [];
    let current = treeWalker.nextNode();
    while (current) {
      toProcess.push(current as Element);
      current = treeWalker.nextNode();
    }
    toProcess.forEach(sanitizeElement);

    return container.innerHTML;
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handlePaste: React.ClipboardEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    const html = e.clipboardData.getData("text/html");
    const text = e.clipboardData.getData("text/plain");
    let toInsert = html ? sanitizeHtml(html) : text.replace(/\n/g, "<br>");

    // Ensure images are responsive when pasting raw html
    toInsert = toInsert.replace(/<img(.*?)>/g, (m) => {
      if (/style=/i.test(m)) return m;
      return m.replace(/<img/i, '<img style="max-width:100%;height:auto"');
    });

    document.execCommand("insertHTML", false, toInsert);
    handleInput();
  };

  const addLink = () => {
    const url = prompt("Enter URL");
    if (url) exec("createLink", url);
  };

  const insertImageAtSelection = (url: string, alt?: string, widthPct: number = 100) => {
    restoreSelection();
    const html = `<img src="${url}" alt="${alt ? alt.replace(/"/g, '\\"') : ""}" style="width:${widthPct}%;max-width:100%;height:auto" />`;
    document.execCommand("insertHTML", false, html);
    handleInput();
  };

  const handleFileUpload: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      const uid = user.user?.id || "anonymous";
      const path = `${uid}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("images").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data } = supabase.storage.from("images").getPublicUrl(path);
      const publicUrl = data.publicUrl;
      setImageUrl(publicUrl);
      if (selectedImageRef.current) {
        const img = selectedImageRef.current;
        img.src = publicUrl;
        img.alt = imageAlt;
        img.style.width = `${imageWidthPct}%`;
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        handleInput();
      } else {
        insertImageAtSelection(publicUrl, imageAlt, imageWidthPct);
      }
      setIsImageDialogOpen(false);
      setImageUrl("");
      setImageAlt("");
    } catch (err) {
      console.error("Upload failed", err);
      alert("Image upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const applyTextColor = (color: string) => {
    exec("foreColor", color);
  };

  const applyBgColor = (color: string) => {
    exec("hiliteColor", color);
  };

  const applyHeading = (level: string) => {
    const block = level === "p" ? "P" : level.toUpperCase();
    exec("formatBlock", block);
  };

  return (
    <div className={cn("rounded-md border border-input bg-background", className)}>
      <div
        className="flex flex-wrap items-center gap-1 p-2 border-b"
        onMouseDownCapture={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("button")) {
            // Prevent toolbar buttons from stealing focus/selection from editor
            e.preventDefault();
          }
        }}
      >
        {/* History */}
        <Button type="button" variant="ghost" size="icon" onClick={() => exec("undo")} title="Undo">
          <Undo2 className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => exec("redo")} title="Redo">
          <Redo2 className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Basic styles */}
        <Button type="button" variant="ghost" size="icon" onClick={() => exec("bold")} title="Bold">
          <Bold className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => exec("italic")} title="Italic">
          <Italic className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => exec("underline")} title="Underline">
          <Underline className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => exec("strikeThrough")} title="Strikethrough">
          <Strikethrough className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Headings */}
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" onClick={() => applyHeading("h1")} title="H1">
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => applyHeading("h2")} title="H2">
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" size="icon" onClick={() => applyHeading("h3")} title="H3">
            <Heading3 className="h-4 w-4" />
          </Button>
        </div>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Lists */}
        <Button type="button" variant="ghost" size="icon" onClick={() => exec("insertUnorderedList")} title="Bullet list">
          <List className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => exec("insertOrderedList")} title="Numbered list">
          <ListOrdered className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Alignment */}
        <Button type="button" variant="ghost" size="icon" onClick={() => exec("justifyLeft")} title="Align left">
          <AlignLeft className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => exec("justifyCenter")} title="Align center">
          <AlignCenter className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => exec("justifyRight")} title="Align right">
          <AlignRight className="h-4 w-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon" onClick={() => exec("justifyFull")} title="Justify">
          <AlignJustify className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Quote / Code */}
        <Button type="button" variant="ghost" size="icon" onClick={() => exec("formatBlock", "BLOCKQUOTE")} title="Blockquote">
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => {
            const sel = window.getSelection();
            const text = sel?.toString() || "";
            if (!text) return;
            document.execCommand("insertHTML", false, `<code>${text.replace(/</g, "&lt;")}</code>`);
            handleInput();
          }}
          title="Inline code"
        >
          <Code className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Link */}
        <Button type="button" variant="ghost" size="icon" onClick={addLink} title="Insert link">
          <LinkIcon className="h-4 w-4" />
        </Button>

        {/* Image */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onMouseDown={(e) => { e.preventDefault(); saveSelection(); }}
          onClick={() => setIsImageDialogOpen(true)}
          title="Insert image"
        >
          <ImageIcon className="h-4 w-4" />
        </Button>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Colors */}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" title="Text color">
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48" align="start">
            <div className="space-y-2">
              <Label htmlFor="rte-text-color">Text color</Label>
              <Input id="rte-text-color" type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} />
              <Button type="button" variant="secondary" className="w-full" onClick={() => applyTextColor(textColor)}>Apply</Button>
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="ghost" size="icon" title="Highlight color">
              <PaintBucket className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48" align="start">
            <div className="space-y-2">
              <Label htmlFor="rte-bg-color">Highlight</Label>
              <Input id="rte-bg-color" type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} />
              <Button type="button" variant="secondary" className="w-full" onClick={() => applyBgColor(bgColor)}>Apply</Button>
            </div>
          </PopoverContent>
        </Popover>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Clear formatting */}
        <Button type="button" variant="ghost" size="icon" onClick={() => exec("removeFormat")} title="Clear formatting">
          <Eraser className="h-4 w-4" />
        </Button>
      </div>

      <div
        ref={editorRef}
        className="rte-content min-h-[200px] max-h-[500px] overflow-y-auto p-3 text-sm outline-none"
        contentEditable
        onInput={handleInput}
        onPaste={handlePaste}
        onFocus={saveSelection}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        data-placeholder={placeholder}
        suppressContentEditableWarning
        style={{ whiteSpace: "pre-wrap" }}
      />

      {/* Image Dialog */}
      <Dialog open={isImageDialogOpen} onOpenChange={setIsImageDialogOpen}>
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle>{editingExistingImage ? "Edit Image" : "Insert Image"}</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Upload a file or paste an image URL. Images are inserted responsively with alt text and adjustable width.
          </DialogDescription>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rte-image-upload">Upload</Label>
              <Input id="rte-image-upload" type="file" accept="image/*" onChange={handleFileUpload} disabled={isUploading} />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <div className="space-y-2">
                <Label htmlFor="rte-image-url">Or from URL</Label>
                <Input id="rte-image-url" placeholder="https://..." value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rte-image-alt">Alt text</Label>
                <Input id="rte-image-alt" placeholder="Describe the image" value={imageAlt} onChange={(e) => setImageAlt(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rte-image-width">Width ({imageWidthPct}%)</Label>
              <input
                id="rte-image-width"
                type="range"
                min={25}
                max={100}
                step={5}
                value={imageWidthPct}
                onChange={(e) => setImageWidthPct(Number(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              onClick={() => {
                if (imageUrl) {
                  if (selectedImageRef.current) {
                    const img = selectedImageRef.current;
                    img.src = imageUrl;
                    img.alt = imageAlt;
                    img.style.width = `${imageWidthPct}%`;
                    img.style.maxWidth = "100%";
                    img.style.height = "auto";
                    handleInput();
                  } else {
                    insertImageAtSelection(imageUrl, imageAlt, imageWidthPct);
                  }
                  setIsImageDialogOpen(false);
                  setImageUrl("");
                  setImageAlt("");
                }
              }}
              disabled={!imageUrl || isUploading}
            >
              {editingExistingImage ? "Apply" : "Insert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Simple placeholder styling */}
      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: hsl(var(--muted-foreground));
        }
        .rte-content h1 { font-size: 1.875rem; line-height: 2.25rem; font-weight: 700; margin: 0.75rem 0; }
        .rte-content h2 { font-size: 1.5rem; line-height: 2rem; font-weight: 700; margin: 0.6rem 0; }
        .rte-content h3 { font-size: 1.25rem; line-height: 1.75rem; font-weight: 600; margin: 0.5rem 0; }
        .rte-content blockquote { border-inline-start: 2px solid hsl(var(--muted-foreground) / 0.3); padding-inline-start: 1rem; color: hsl(var(--muted-foreground)); }
        .rte-content img { max-width: 100%; height: auto; }
        .rte-content ul { list-style: disc; padding-left: 1.25rem; margin: 0.5rem 0; }
        .rte-content ol { list-style: decimal; padding-left: 1.25rem; margin: 0.5rem 0; }
        .rte-content li { margin: 0.25rem 0; }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
