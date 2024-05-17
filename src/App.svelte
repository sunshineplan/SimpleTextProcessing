<script lang="ts">
  import { javascript } from "@codemirror/lang-javascript";
  import {
    EditorView,
    drawSelection,
    highlightActiveLineGutter,
    lineNumbers,
    placeholder,
  } from "@codemirror/view";
  import { EditorState } from "@codemirror/state";
  import { highlightSelectionMatches } from "@codemirror/search";
  import { onMount } from "svelte";
  import * as stp from "./stp";
  import Checkbox from "./Checkbox.svelte";

  let data: EditorView, result: EditorView;
  let trimSpace = false;
  let cutSpace = false;
  let removeParentheses = false;
  let trim = false;
  let trimCutset = "";
  let cut = false;
  let cutSep = "";
  let removeByRegExp = false;
  let re = "";
  let loading = true;
  let s2t = false;
  let t2s = false;
  let s2tp: stp.processor, t2sp: stp.processor;

  const initOpenCC = () => {
    s2tp = new stp.processor(true, OpenCC.Converter({ from: "cn", to: "t" }));
    t2sp = new stp.processor(true, OpenCC.Converter({ from: "t", to: "cn" }));
    loading = false;
  };

  onMount(() => {
    data = new EditorView({
      doc: localStorage.getItem("data") || "",
      parent: document.getElementById("input")!,
      extensions: [
        javascript(),
        drawSelection(),
        highlightActiveLineGutter(),
        highlightSelectionMatches(),
        lineNumbers(),
        placeholder("Paste content here..."),
        EditorView.lineWrapping,
      ],
    });
    result = new EditorView({
      doc: "",
      parent: document.getElementById("result")!,
      extensions: [
        javascript(),
        drawSelection(),
        highlightSelectionMatches(),
        lineNumbers(),
        EditorView.lineWrapping,
        EditorState.readOnly.of(true),
      ],
    });
  });

  const process = () => {
    const task = new stp.tasks();
    if (trimSpace) task.append(stp.trimSpace);
    if (cutSpace) task.append(stp.cutSpace);
    if (removeParentheses) task.append(...stp.removeParentheses.tasks);
    if (trim) task.append(new stp.trim(trimCutset));
    if (cut) task.append(new stp.cut(cutSep));
    if (removeByRegExp) task.append(new stp.removeByRegExp(new RegExp(re)));
    if (s2t) task.append(s2tp);
    else if (t2s) task.append(t2sp);
    if (!task.tasks.length) {
      alert("No option selected.")
      return
    }
    loading = true;
    const process = processing();
    const r = task.processAll(data.state.doc.toString().split("\n"));
    clearInterval(process);
    result.dispatch({
      changes: {
        from: 0,
        to: result.state.doc.length,
        insert: r.join("\n"),
      },
    });
    loading = false;
  };

  const clear = () => {
    if (!confirm("Clear all data and options?")) return;
    data.dispatch({ changes: { from: 0, to: data.state.doc.length } });
    result.dispatch({ changes: { from: 0, to: result.state.doc.length } });
    trimSpace = false;
    cutSpace = false;
    removeParentheses = false;
    trim = false;
    trimCutset = "";
    cut = false;
    cutSep = "";
    removeByRegExp = false;
    re = "";
    s2t = false;
    t2s = false;
    localStorage.clear();
  };

  const copy = async () => {
    const res = result.state.doc.toString();
    if (res.trim() !== "")
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(res.trim());
        alert("Text has been copied to clipboard.");
      } else
        alert("This function requires a secure origin. (HTTPS or localhost)");
  };

  const processing = () => {
    return setInterval(() => {
      const s = result.state.doc.toString().split("Processing");
      let dots = s.length >= 2 ? s[1].length : 0;
      if (dots < 3) dots++;
      else dots -= 3;
      result.dispatch({
        changes: {
          from: 0,
          to: result.state.doc.length,
          insert: "Processing" + ".".repeat(dots),
        },
      });
    }, 200);
  };
</script>

<svelte:window
  on:beforeunload={() =>
    localStorage.setItem("data", data.state.doc.toString())}
/>

<svelte:head>
  <script
    src="https://cdn.jsdelivr.net/npm/opencc-js@1/dist/umd/full.min.js"
    on:load={initOpenCC}
  >
  </script>
</svelte:head>

<header class="navbar navbar-expand navbar-light flex-column flex-md-row">
  <a
    class="navbar-brand text-primary m-0 mr-md-3"
    href="/"
    style="font-size:24px"
  >
    Simple Text Processing
  </a>
</header>
<div class="container-fluid">
  <div class="row h-100">
    <div id="input" class="col-5 h-100">
      <label for="input">Data</label>
    </div>
    <div class="col-2 p-0 pt-5">
      <Checkbox id="TrimSpace" bind:checked={trimSpace} />
      <Checkbox id="CutSpace" bind:checked={cutSpace} />
      <Checkbox id="RemoveParentheses" bind:checked={removeParentheses} />
      <br />
      <div class="form-check">
        <input
          class="form-check-input"
          type="checkbox"
          checked={t2s}
          id="t2s"
          on:click={() => {
            t2s = !t2s;
            if (t2s) s2t = false;
          }}
        />
        <label class="form-check-label" for="t2s">繁 → 简</label>
      </div>
      <div class="form-check">
        <input
          class="form-check-input"
          type="checkbox"
          checked={s2t}
          id="s2t"
          on:click={() => {
            s2t = !s2t;
            if (s2t) t2s = false;
          }}
        />
        <label class="form-check-label" for="s2t">简 → 繁</label>
      </div>
      <br />
      <Checkbox
        id="Trim"
        placeholder="Cutset"
        bind:checked={trim}
        bind:optional={trimCutset}
      />
      <Checkbox
        id="Cut"
        placeholder="Sep"
        bind:checked={cut}
        bind:optional={cutSep}
      />
      <Checkbox
        id="Remove"
        placeholder="RegExp"
        bind:checked={removeByRegExp}
        bind:optional={re}
      />
      <br />
      <button
        on:click={process}
        type="button"
        class="btn btn-primary w-100"
        disabled={loading}
      >
        Process
      </button>
      <br />
      <br />
      <button
        on:click={copy}
        type="button"
        class="btn btn-primary w-100"
        disabled={loading}
      >
        Copy Result
      </button>
      <br />
      <br />
      <button
        on:click={clear}
        type="button"
        class="btn btn-danger w-100"
        disabled={loading}
      >
        Clear
      </button>
    </div>
    <div id="result" class="col-5 h-100">
      <label for="result">Result</label>
    </div>
  </div>
</div>

<style>
  .navbar {
    height: 80px;
    padding-left: 1rem;
    padding-right: 1rem;
  }

  .container-fluid {
    position: fixed;
    height: calc(100% - 80px);
  }
</style>
