import type { EmailBlock, CanvasSettings } from '../components/EmailCanvasEditor';

const LH_LOGO_URL = 'https://ci3.googleusercontent.com/meips/ADKq_Nbh0scve2cZRUusXtQjOQaWv4ZYTcEZBJnNjwoluN2y6bJKSHTUkyivY6DWHPt5AMrFJIG4CQmXXbJ1pvqgM-SC2sS1Zhlpp06s0OZTCcw4WctNxU0_CxK-uTZCbsA8F32zN44hduwuh_TZZzUjBquGMw=s0-d-e1-ft#https://livlycontent.azureedge.net/client-images/54/fbf13078-2558-457a-949e-90c67e91da86.jpg';

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');
}

function escAttr(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function blockRow(content: string): string {
  return `<tr><td align="center" style="padding:0;">${content}</td></tr>`;
}

function renderBlock(block: EmailBlock, templateImageUrl?: string): string {
  switch (block.type) {
    case 'flyer': {
      if (!templateImageUrl) return '';
      const inner = `<img src="${escAttr(templateImageUrl)}" alt="Flyer" width="560" style="display:block;max-width:100%;height:auto;border-radius:8px;margin:0 auto;" />`;
      return blockRow(`<table width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 20px 0 20px;">${inner}</td></tr></table>`);
    }
    case 'title': {
      const s = block.styles;
      return blockRow(`<table width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:20px 20px 8px 20px;text-align:center;font-family:${s.fontFamily};font-weight:${s.fontWeight};font-size:${s.fontSize}px;color:${s.color};line-height:${s.lineHeight};">${esc(block.content)}</td></tr></table>`);
    }
    case 'text': {
      const s = block.styles;
      return blockRow(`<table width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td align="${s.textAlign}" style="padding:0 20px;text-align:${s.textAlign};font-family:${s.fontFamily};font-weight:${s.fontWeight};font-size:${s.fontSize}px;color:${s.color};line-height:${s.lineHeight};white-space:pre-wrap;">${esc(block.content)}</td></tr></table>`);
    }
    case 'image': {
      if (!block.src) return '';
      const isLogo = block.alt === 'Liberty Harbor Events';
      const src = isLogo ? LH_LOGO_URL : block.src;
      const s = block.styles;
      const inner = `<img src="${escAttr(src)}" alt="${escAttr(block.alt)}" style="display:block;max-width:${isLogo ? '100%' : s.maxWidth};height:auto;${s.borderRadius ? `border-radius:${s.borderRadius}px;` : ''}margin:0 auto;" />`;
      return blockRow(`<table width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:0 20px;">${inner}</td></tr></table>`);
    }
    case 'button': {
      const s = block.styles;
      const inner = `<a href="${escAttr(block.url)}" target="_blank" style="display:inline-block;background-color:${s.bgColor};color:${s.textColor};padding:${s.paddingY}px ${s.paddingX}px;border-radius:${s.borderRadius}px;font-size:${s.fontSize}px;text-decoration:none;font-weight:600;font-family:sans-serif;mso-padding-alt:0;text-align:center;"><!--[if mso]><i style="letter-spacing:${s.paddingX}px;mso-font-width:-100%;mso-text-raise:${s.paddingY * 1.5}pt;">&nbsp;</i><![endif]--><span style="mso-text-raise:${Math.round(s.paddingY * 0.75)}pt;">${esc(block.label)}</span><!--[if mso]><i style="letter-spacing:${s.paddingX}px;mso-font-width:-100%;">&nbsp;</i><![endif]--></a>`;
      return blockRow(`<table width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td align="${s.align}" style="padding:0 20px;">${inner}</td></tr></table>`);
    }
    case 'divider': {
      const s = block.styles;
      const widthVal = s.width === '100%' ? '90%' : s.width;
      const inner = `<table width="${widthVal}" border="0" cellpadding="0" cellspacing="0" align="center"><tr><td style="border-top:${s.thickness}px solid ${s.color};font-size:1px;line-height:1px;">&nbsp;</td></tr></table>`;
      return blockRow(inner);
    }
    case 'spacer': {
      return `<tr><td style="height:${block.height}px;font-size:1px;line-height:${block.height}px;">&nbsp;</td></tr>`;
    }
    case 'social': {
      const s = block.styles;
      let icons = '';
      block.links.forEach((link, i) => {
        const mr = i < block.links.length - 1 ? `padding-right:${s.gap}px;` : '';
        icons += `<td style="${mr}"><a href="${escAttr(link.url)}" target="_blank"><img src="${escAttr(link.iconUrl)}" alt="${escAttr(link.platform)}" width="${s.iconSize}" height="${s.iconSize}" style="display:block;border:0;border-radius:50%;" /></a></td>`;
      });
      const inner = `<table border="0" cellpadding="0" cellspacing="0" align="${s.align}"><tr>${icons}</tr></table>`;
      return blockRow(`<table width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td align="${s.align}" style="padding:0 20px;">${inner}</td></tr></table>`);
    }
    case 'link': {
      const s = block.styles;
      const inner = `<a href="${escAttr(block.url)}" target="_blank" style="color:${s.color};font-size:${s.fontSize}px;font-weight:${s.fontWeight};font-family:sans-serif;text-decoration:underline;">${esc(block.label)}</a>`;
      return blockRow(`<table width="100%" border="0" cellpadding="0" cellspacing="0"><tr><td align="${s.textAlign}" style="padding:0 20px;">${inner}</td></tr></table>`);
    }
    default:
      return '';
  }
}

export function blocksToEmailHtml(
  blocks: EmailBlock[],
  settings: CanvasSettings,
  templateImageUrl?: string
): string {
  const rows = blocks
    .map((block) => renderBlock(block, templateImageUrl))
    .filter(Boolean)
    .join('\n');

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Email</title>
<!--[if mso]>
<style type="text/css">
body, table, td { font-family: Arial, Helvetica, sans-serif !important; }
</style>
<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;-webkit-font-smoothing:antialiased;">
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f4f4f5;">
<tr>
<td align="center" style="padding:40px 0;">
<!--[if mso]><table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600"><tr><td><![endif]-->
<table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;">
${rows}
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td>
</tr>
</table>
</body>
</html>`;
}
