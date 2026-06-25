import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const N8N_WEBHOOK_URL =
  "https://libertyharborai.app.n8n.cloud/webhook/ompany-test-0625";

type Recipient = {
  id: string;
  name: string;
  email: string;
  building: string;
  unit: string;
  is_static?: boolean;
};

type RequestBody = {
  template: {
    id: string;
    name: string;
    description?: string;
    category?: string;
    image_url: string;
    storage_path?: string | null;
  };
  audience: {
    buildings: string[];
    include_ten_regent: boolean;
  };
  recipients: Recipient[];
  content_html?: string;
  subject_line?: string;
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as RequestBody;

    if (!body?.template?.image_url || !Array.isArray(body?.recipients)) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const flyerRes = await fetch(body.template.image_url);
    if (!flyerRes.ok) {
      return new Response(
        JSON.stringify({
          error: `Could not load flyer image (${flyerRes.status}).`,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    const mimeType = flyerRes.headers.get("content-type") || "image/png";
    const flyerBuffer = await flyerRes.arrayBuffer();

    const rawName =
      body.template.storage_path?.split("/").pop() ||
      `${body.template.name.replace(/[^a-z0-9._-]+/gi, "_")}.${mimeType.split("/")[1] || "png"}`;
    const filename = rawName;

    const sentAt = new Date().toISOString();
    const metadata = {
      sent_at: sentAt,
      property: "Liberty Harbor",
      subject_line: body.subject_line || body.template.name,
      template: {
        id: body.template.id,
        name: body.template.name,
        description: body.template.description ?? null,
        category: body.template.category ?? null,
        image_url: body.template.image_url,
        storage_path: body.template.storage_path ?? null,
        filename,
        mime_type: mimeType,
        size: flyerBuffer.byteLength,
      },
      audience: body.audience,
      recipients: body.recipients,
      recipient_count: body.recipients.length,
    };

    const form = new FormData();
    form.append("payload", JSON.stringify(metadata));
    form.append("sent_at", sentAt);
    form.append("template_name", body.template.name);
    form.append("subject_line", body.subject_line || body.template.name);
    form.append("recipient_count", String(body.recipients.length));
    form.append("recipients", JSON.stringify(body.recipients));
    form.append("buildings", JSON.stringify(body.audience.buildings));
    form.append("include_ten_regent", String(body.audience.include_ten_regent));
    if (body.content_html) {
      form.append("content_html", body.content_html);
    }
    form.append(
      "flyer",
      new Blob([flyerBuffer], { type: mimeType }),
      filename,
    );

    const webhookRes = await fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      body: form,
    });

    const responseText = await webhookRes.text();

    if (!webhookRes.ok) {
      return new Response(
        JSON.stringify({
          error: `n8n webhook returned ${webhookRes.status}`,
          detail: responseText.slice(0, 500),
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        sent_at: sentAt,
        recipient_count: body.recipients.length,
        flyer_size: flyerBuffer.byteLength,
        n8n_status: webhookRes.status,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error(e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
