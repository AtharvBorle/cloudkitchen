const fs = require('fs');
const fn = 'c:\\\\Users\\\\omkar\\\\Downloads\\\\antg\\\\neo-cloud-room\\\\src\\\\app\\\\dashboard\\\\superadmin\\\\coupons\\\\client-page.tsx';
let txt = fs.readFileSync(fn, 'utf-8');

txt = txt.replace(
    "    validUntil: string | null;\r\n    isActive: boolean;\r\n};",
    "    validUntil: string | null;\r\n    maxUsagesPerUser?: number | null;\r\n    validForFirstNOrders?: number | null;\r\n    minimumCartValue?: number | null;\r\n    isActive: boolean;\r\n};"
).replace(
    "    validUntil: string | null;\n    isActive: boolean;\n};",
    "    validUntil: string | null;\n    maxUsagesPerUser?: number | null;\n    validForFirstNOrders?: number | null;\n    minimumCartValue?: number | null;\n    isActive: boolean;\n};"
);

txt = txt.replace(
    "    const [hasEndDate, setHasEndDate] = useState(false);\r\n    const [validUntil, setValidUntil] = useState(\\\"\\\");",
    "    const [hasEndDate, setHasEndDate] = useState(false);\r\n    const [validUntil, setValidUntil] = useState(\\\"\\\");\r\n\r\n    // Advanced fields\r\n    const [maxUsagesPerUser, setMaxUsagesPerUser] = useState(\\\"\\\");\r\n    const [validForFirstNOrders, setValidForFirstNOrders] = useState(\\\"\\\");\r\n    const [minimumCartValue, setMinimumCartValue] = useState(\\\"\\\");"
).replace(
    "    const [hasEndDate, setHasEndDate] = useState(false);\n    const [validUntil, setValidUntil] = useState(\\\"\\\");",
    "    const [hasEndDate, setHasEndDate] = useState(false);\n    const [validUntil, setValidUntil] = useState(\\\"\\\");\n\n    // Advanced fields\n    const [maxUsagesPerUser, setMaxUsagesPerUser] = useState(\\\"\\\");\n    const [validForFirstNOrders, setValidForFirstNOrders] = useState(\\\"\\\");\n    const [minimumCartValue, setMinimumCartValue] = useState(\\\"\\\");"
);

txt = txt.replace(
    "                validUntil: hasEndDate && validUntil ? new Date(validUntil).toISOString() : null\r\n            };",
    "                validUntil: hasEndDate && validUntil ? new Date(validUntil).toISOString() : null,\r\n                maxUsagesPerUser: maxUsagesPerUser ? parseInt(maxUsagesPerUser) : null,\r\n                validForFirstNOrders: validForFirstNOrders ? parseInt(validForFirstNOrders) : null,\r\n                minimumCartValue: minimumCartValue ? parseFloat(minimumCartValue) : null\r\n            };"
).replace(
    "                validUntil: hasEndDate && validUntil ? new Date(validUntil).toISOString() : null\n            };",
    "                validUntil: hasEndDate && validUntil ? new Date(validUntil).toISOString() : null,\n                maxUsagesPerUser: maxUsagesPerUser ? parseInt(maxUsagesPerUser) : null,\n                validForFirstNOrders: validForFirstNOrders ? parseInt(validForFirstNOrders) : null,\n                minimumCartValue: minimumCartValue ? parseFloat(minimumCartValue) : null\n            };"
);

txt = txt.replace(
    "                setValidUntil(\\\"\\\");\r\n            } else {",
    "                setValidUntil(\\\"\\\");\r\n                setMaxUsagesPerUser(\\\"\\\");\r\n                setValidForFirstNOrders(\\\"\\\");\r\n                setMinimumCartValue(\\\"\\\");\r\n            } else {"
).replace(
    "                setValidUntil(\\\"\\\");\n            } else {",
    "                setValidUntil(\\\"\\\");\n                setMaxUsagesPerUser(\\\"\\\");\n                setValidForFirstNOrders(\\\"\\\");\n                setMinimumCartValue(\\\"\\\");\n            } else {"
);

const advancedHtml = `
                        <hr style={{ border: "none", borderTop: "1px solid #f1f5f9" }} />

                        {/* Advanced Rules */}
                        <div>
                            <h4 style={{ fontSize: "1rem", fontWeight: "600", color: "#334155", marginBottom: "1rem" }}>Advanced Rules (Optional)</h4>
                            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }}>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Minimum Cart Value (₹)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={minimumCartValue}
                                        onChange={(e) => setMinimumCartValue(e.target.value)}
                                        placeholder="e.g. 500"
                                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                    />
                                    <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px" }}>Leave empty for no minimum.</p>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Max Usages Per User</label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={maxUsagesPerUser}
                                        onChange={(e) => setMaxUsagesPerUser(e.target.value)}
                                        placeholder="e.g. 1"
                                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                    />
                                    <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px" }}>Leave empty for unlimited.</p>
                                </div>
                                <div>
                                    <label style={{ display: "block", fontSize: "0.85rem", fontWeight: "600", color: "#475569", marginBottom: "8px" }}>Valid For First N Orders</label>
                                    <input
                                        type="number"
                                        min="1"
                                        step="1"
                                        value={validForFirstNOrders}
                                        onChange={(e) => setValidForFirstNOrders(e.target.value)}
                                        placeholder="e.g. 2"
                                        style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #cbd5e1" }}
                                    />
                                    <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "4px" }}>Leave empty to allow for any. Set 1 for new user offer.</p>
                                </div>
                            </div>
                        </div>

`;

txt = txt.replace(
    "                        <button\r\n                            type=\"submit\"",
    advancedHtml.replace(/\n/g, '\r\n') + "                        <button\r\n                            type=\"submit\""
).replace(
    "                        <button\n                            type=\"submit\"",
    advancedHtml + "                        <button\n                            type=\"submit\""
);

const displayHtml = `                                        ) : (
                                            "Never (Indefinite)"
                                        )}
                                    </div>
                                    
                                    {/* Advanced Rules Indicators */}
                                    {(coupon.minimumCartValue || coupon.maxUsagesPerUser || coupon.validForFirstNOrders) && (
                                        <div style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px dashed #cbd5e1", display: "flex", flexWrap: "wrap", gap: "8px" }}>
                                            {coupon.minimumCartValue && (
                                                <span style={{ fontSize: "0.75rem", fontWeight: "600", backgroundColor: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", color: "#475569" }}>Min order: ₹{coupon.minimumCartValue}</span>
                                            )}
                                            {coupon.maxUsagesPerUser && (
                                                <span style={{ fontSize: "0.75rem", fontWeight: "600", backgroundColor: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", color: "#475569" }}>Max {coupon.maxUsagesPerUser} use/user</span>
                                            )}
                                            {coupon.validForFirstNOrders && (
                                                <span style={{ fontSize: "0.75rem", fontWeight: "600", backgroundColor: "#f1f5f9", padding: "4px 8px", borderRadius: "4px", color: "#475569" }}>First {coupon.validForFirstNOrders} orders only</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>`;

txt = txt.replace(
    "                                        ) : (\r\n                                            \"Never (Indefinite)\"\r\n                                        )}\r\n                                    </div>\r\n                                </div>\r\n                            </div>",
    displayHtml.replace(/\n/g, '\r\n')
).replace(
    "                                        ) : (\n                                            \"Never (Indefinite)\"\n                                        )}\n                                    </div>\n                                </div>\n                            </div>",
    displayHtml
);

fs.writeFileSync(fn, txt);
console.log('Update Complete.');
