// /codes — hub page listing every reviewed OBD-II code guide (data/codePages.ts), grouped by system.
import React from "react";
import { Link } from "react-router-dom";
import { ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { CODE_PAGES, type CodePage } from "../data/codePages";
import SEO from "./SEO";
import { Panel, PanelTitle, ToolPage, Verdict, focusRing } from "./tool/kit";

const VERDICT_LABEL = {
    go: "Safe to drive",
    caution: "Drive with caution",
    stop: "Get it checked now",
} as const;

export const DESCRIPTION =
    "Plain-English guides to common check engine (OBD-II) codes: what each means, whether it's safe to drive, the usual causes and what to check first.";

const linkClass = cn("font-semibold underline underline-offset-4", focusRing);

// Codes covered by a full article instead of a code page.
const ARTICLE_GUIDES = [
    {
        code: "P0420",
        title: "Catalyst System Efficiency Below Threshold (Bank 1)",
        href: "/article/p0420-code-catalytic-converter-sensor-guide",
        summary:
            "The catalytic converter on bank 1 isn’t cleaning the exhaust as well as it should, or a sensor says so.",
    },
];

const GROUPS: { title: string; match: (p: CodePage) => boolean }[] = [
    { title: "Misfires and ignition", match: (p) => /^P030/.test(p.code) },
    { title: "Fuel and air mixture", match: (p) => /^P017/.test(p.code) },
    { title: "Engine temperature", match: (p) => /^P01[12]/.test(p.code) },
    { title: "Fuel vapor (EVAP) leaks", match: (p) => /^P04[45]/.test(p.code) },
];

function CodeItem({ page }: { page: CodePage }) {
    return (
        <li className="border-t border-border pt-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <Link
                    to={`/codes/${page.code.toLowerCase()}`}
                    className={linkClass}
                >
                    {page.code}: {page.title}
                </Link>
                <Verdict tone={page.drive.verdict}>
                    {VERDICT_LABEL[page.drive.verdict]}
                </Verdict>
            </div>
            <p className="mt-1.5 text-[0.9375rem] text-muted-foreground">
                {page.summary}
            </p>
        </li>
    );
}

const CodeIndex: React.FC = () => {
    const grouped = GROUPS.map((g) => ({
        ...g,
        pages: CODE_PAGES.filter(g.match),
    })).filter((g) => g.pages.length);
    const other = CODE_PAGES.filter((p) => !GROUPS.some((g) => g.match(p)));
    if (other.length)
        grouped.push({
            title: "Other codes",
            match: () => false,
            pages: other,
        });

    return (
        <>
            <SEO
                title="Check Engine Code Guides (OBD-II)"
                description={DESCRIPTION}
            />
            <ToolPage
                category="warnings"
                title="Check engine code guides"
                intro="Plain-English guides to common OBD-II trouble codes: what each one means, whether it's safe to keep driving, the usual causes and what to check before you replace parts."
            >
                <div className="grid gap-6 lg:grid-cols-[1fr_minmax(0,22rem)]">
                    <div className="min-w-0 space-y-6">
                        {grouped.map((g) => (
                            <Panel key={g.title}>
                                <PanelTitle>{g.title}</PanelTitle>
                                <ul className="mt-4 space-y-4">
                                    {g.pages.map((p) => (
                                        <CodeItem key={p.code} page={p} />
                                    ))}
                                </ul>
                            </Panel>
                        ))}
                        <Panel>
                            <PanelTitle>Catalytic converter</PanelTitle>
                            <ul className="mt-4 space-y-4">
                                {ARTICLE_GUIDES.map((a) => (
                                    <li
                                        key={a.code}
                                        className="border-t border-border pt-4"
                                    >
                                        <Link to={a.href} className={linkClass}>
                                            {a.code}: {a.title}
                                        </Link>
                                        <p className="mt-1.5 text-[0.9375rem] text-muted-foreground">
                                            {a.summary}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        </Panel>
                    </div>

                    <aside className="space-y-6">
                        <Panel>
                            <PanelTitle>Code not listed?</PanelTitle>
                            <p className="mt-3 text-[0.9375rem]">
                                The code lookup explains any OBD-II code for
                                your year, make and model, including what drives
                                the repair cost.
                            </p>
                            <Link
                                to="/fault-code-decoder"
                                className={cn(
                                    "mt-4 flex h-11 items-center justify-center rounded-lg bg-sign-green px-5 font-bold text-white hover:bg-sign-green-strong",
                                    focusRing,
                                )}
                            >
                                Look up a code
                            </Link>
                        </Panel>
                        <Panel>
                            <PanelTitle>How to read a code</PanelTitle>
                            <p className="mt-3 text-[0.9375rem]">
                                The first letter is the system:{" "}
                                <strong>P</strong> for powertrain (engine and
                                transmission), <strong>B</strong> for body,{" "}
                                <strong>C</strong> for chassis and{" "}
                                <strong>U</strong> for network communication. A{" "}
                                <strong>0</strong> as the second character marks
                                a generic code with the same meaning on every
                                make; a <strong>1</strong> usually marks a
                                manufacturer-specific one.
                            </p>
                            <p className="mt-3 text-sm text-muted-foreground">
                                Source:{" "}
                                <a
                                    href="https://saemobilus.sae.org/standards/j2012_202509-diagnostic-trouble-code-definitions"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                        "inline-flex items-center gap-1 underline underline-offset-4",
                                        focusRing,
                                    )}
                                >
                                    SAE J2012, diagnostic trouble code
                                    definitions
                                    <ExternalLink
                                        aria-hidden="true"
                                        className="size-3.5"
                                    />
                                </a>
                            </p>
                        </Panel>
                    </aside>
                </div>
            </ToolPage>
        </>
    );
};

export default CodeIndex;
