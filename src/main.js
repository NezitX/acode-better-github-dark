import plugin from "../plugin.json";
import style from "./style.scss";

const settings = acode.require("settings");
const { editor } = editorManager;

const THEME_NAME = "better-github-dark";
const THEME_IS_DARK = true;

ace.define(
  `ace/theme/${THEME_NAME}.css`,
  ["require", "exports", "module"],
  function (require, exports, module) {
    module.exports = style;
  }
);

ace.define(
  `ace/theme/${THEME_NAME}`,
  [
    "require",
    "exports",
    "module",
    `ace/theme/${THEME_NAME}.css`,
    "ace/lib/dom"
  ],
  function (require, exports, module) {
    exports.isDark = THEME_IS_DARK;
    exports.cssClass = `ace-${THEME_NAME}`;
    exports.cssText = require(`./${THEME_NAME}.css`);
    const dom = require("../lib/dom");
    dom.importCssString(exports.cssText, exports.cssClass, false);
  }
);

(function () {
  window.require([`ace/theme/${THEME_NAME}`], function (m) {
    if (typeof module == "object" && typeof exports == "object" && module) {
      module.exports = m;
    }
  });
})();

class BetterGithubDark {
  async init() {
    try {
      ace.require("ace/ext/themelist").themes.push({
        caption: THEME_NAME.split("-")
          .map(name => name[0].toUpperCase() + name.slice(1))
          .join(" "),
        theme: "ace/theme/" + THEME_NAME,
        isDark: THEME_IS_DARK
      });

      const currentTheme = settings.get("editorTheme");
      if (currentTheme === THEME_NAME)
        editor.setTheme("ace/theme/" + THEME_NAME);
      settings.on("update", this.onThemeChange.bind(this));
    } catch (error) {
      console.error(error);
      acode.alert("Warning", "Please restart acode");
    }
  }

  async destroy() {
    settings.off("update", this.onThemeChange);
  }

  onThemeChange(value) {
    if (typeof value !== "string") return;
    let themeName = value;
    if (value.startsWith("ace/theme/"))
      themeName = value?.replace("ace/theme/", "");

    editor.setTheme(`ace/theme/${themeName}`);
    settings.update({ editorTheme: themeName });
  }
}

if (window.acode) {
  const betterGithubDark = new BetterGithubDark();
  acode.setPluginInit(
    plugin.id,
    async (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
      if (!baseUrl.endsWith("/")) baseUrl += "/";

      betterGithubDark.baseUrl = baseUrl;
      await betterGithubDark.init($page, cacheFile, cacheFileUrl);
    }
  );

  acode.setPluginUnmount(plugin.id, () => {
    betterGithubDark.destroy();
  });
}
