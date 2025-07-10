<script lang="ts">
  import Handsontable from "handsontable/base";
  import {
    AutoColumnSize,
    ContextMenu,
    CopyPaste,
    registerPlugin,
  } from "handsontable/plugins";
  import "handsontable/styles/handsontable.min.css";
  import "handsontable/styles/ht-theme-main.min.css";
  import { onMount } from "svelte";
  import Checkbox from "./Checkbox.svelte";
  import * as stp from "./stp";

  registerPlugin(AutoColumnSize);
  registerPlugin(ContextMenu);
  registerPlugin(CopyPaste);

  const rowHeaderWidth = 64;

  let trimSpace = $state(false);
  let cutSpace = $state(false);
  let removeParentheses = $state(false);
  let trim = $state(false);
  let trimCutset = $state("");
  let cut = $state(false);
  let cutSep = $state("");
  let removeByRegExp = $state(false);
  let re = $state("");
  let loading = $state(true);
  let s2t = $state(false);
  let t2s = $state(false);

  let data: Handsontable, result: Handsontable;
  let s2tp: stp.processor, t2sp: stp.processor;

  const initOpenCC = () => {
    s2tp = new stp.processor(true, OpenCC.Converter({ from: "cn", to: "t" }));
    t2sp = new stp.processor(true, OpenCC.Converter({ from: "t", to: "cn" }));
    loading = false;
  };

  const create_table = (
    elementId: string,
    name: string,
    key: string,
    readOnly?: boolean,
  ) => {
    const options: Handsontable.GridSettings = {
      autoColumnSize: false,
      colHeaders: [name],
      colWidths() {
        return Math.round(
          window.innerWidth * 0.4166666667 - rowHeaderWidth - 24,
        );
      },
      height() {
        return window.innerHeight - 80 - 16;
      },
      maxCols: 1,
      rowHeaders: true,
      rowHeaderWidth,
      startRows: 1,
      tabMoves: { row: 1, col: 0 },
      themeName: "ht-theme-main",
      licenseKey: "non-commercial-and-evaluation",
    };
    if (readOnly) {
      options.readOnly = true;
      options.readOnlyCellClassName = "";
      options.contextMenu = ["copy"];
    } else {
      try {
        options.data = JSON.parse(localStorage.getItem(key) || "");
      } catch (e) {
        options.data = undefined;
      }
      options.minSpareRows = 1;
      options.contextMenu = [
        "row_above",
        "row_below",
        "---------",
        "remove_row",
        "---------",
        "undo",
        "redo",
        "---------",
        "copy",
        "cut",
      ];
    }
    const table = new Handsontable(
      document.getElementById(elementId)!,
      options,
    );
    if (!readOnly) {
      table.addHook("beforePaste", () =>
        table.updateSettings({ readOnly: true }),
      );
      table.addHook("afterPaste", (data) => {
        table.updateSettings({ readOnly: false });
        table.deselectCell();
        for (let i = data.length - 1; i >= 0; i--)
          if (data[i][0] !== "") {
            table.loadData(data.slice(0, i + 1));
            return;
          }
        table.loadData([[""]]);
      });
    }
    return table;
  };

  onMount(() => {
    data = create_table("input", "Data", "data");
    result = create_table("result", "Result", "", true);
  });

  const getData = (table: Handsontable) => {
    return table.getDataAtCol(0).filter((i) => i !== null);
  };

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
      alert("No option selected.");
      return;
    }
    loading = true;
    const r = task.processAll(getData(data));
    result.loadData(r.map((i) => [i]));
    loading = false;
  };

  const clear = () => {
    if (!confirm("Clear all data and options?")) return;
    data.loadData([[""]]);
    result.loadData([[""]]);
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
    const res = getData(result).join("\n");
    if (res.trim() !== "")
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(res.trimEnd());
        alert("Text has been copied to clipboard.");
      } else
        alert("This function requires a secure origin. (HTTPS or localhost)");
  };
</script>

<svelte:window
  onbeforeunload={() =>
    localStorage.setItem("data", JSON.stringify(data.getData()))}
/>

<svelte:head>
  <script
    src="https://cdn.jsdelivr.net/npm/opencc-js@1/dist/umd/full.min.js"
    onload={initOpenCC}
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
    <div id="input" class="col-5"></div>
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
          onclick={() => {
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
          onclick={() => {
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
        onclick={process}
        type="button"
        class="btn btn-primary w-100"
        disabled={loading}
      >
        Process
      </button>
      <br />
      <br />
      <button
        onclick={copy}
        type="button"
        class="btn btn-primary w-100"
        disabled={loading}
      >
        Copy Result
      </button>
      <br />
      <br />
      <button
        onclick={clear}
        type="button"
        class="btn btn-danger w-100"
        disabled={loading}
      >
        Clear
      </button>
    </div>
    <div id="result" class="col-5"></div>
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
