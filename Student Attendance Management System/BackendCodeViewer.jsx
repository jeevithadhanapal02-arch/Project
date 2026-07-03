import { useState } from "react";
import { MYSQL_SCHEMA, PYTHON_APP, DOTENV_TEMPLATE } from "../backendCode";

const TABS = [
  { key: "schema", label: "schema.sql",  code: MYSQL_SCHEMA },
  { key: "app",    label: "app.py",      code: PYTHON_APP },
  { key: "env",    label: ".env",        code: DOTENV_TEMPLATE },
];

export default function BackendCodeViewer() {
  const [active, setActive] = useState("schema");
  const current = TABS.find((t) => t.key === active);

  return (
    <div className="code-viewer">
      <div className="code-viewer-header">
        <h3 className="section-title">Backend Source Code</h3>
        <p className="code-viewer-desc">
          Python Flask + MySQL backend. Copy these files to your server.
          Install: <code>pip install flask flask-cors mysql-connector-python PyJWT bcrypt python-dotenv</code>
        </p>
      </div>

      <div className="code-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`code-tab-btn${active === t.key ? " active-code-tab" : ""}`}
            onClick={() => setActive(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="code-block-wrap">
        <button
          className="copy-btn"
          onClick={() => navigator.clipboard.writeText(current.code.trim())}
        >
          Copy
        </button>
        <pre className="code-block"><code>{current.code.trim()}</code></pre>
      </div>
    </div>
  );
}
