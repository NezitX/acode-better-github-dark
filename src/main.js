import plugin from "../plugin.json";
import style from "./style.scss";

const settings = acode.require("settings");
const { editor } = editorManager;
const themesList = ace.require("ace/ext/themelist").themes;

const THEME_NAME = "better-github-dark";
const THEME_IS_DARK = true;

// Define theme CSS first
ace.define(
  `ace/theme/${THEME_NAME}.css`,
  ["require", "exports", "module"],
  (require, exports, module) => {
    module.exports = style;
  }
);

// Simplified theme definition
ace.define(
  `ace/theme/${THEME_NAME}`,
  ["require", "exports", "module", "ace/lib/dom"],
  (require, exports, module) => {
    const dom = require("ace/lib/dom");
    
    exports.isDark = THEME_IS_DARK;
    exports.cssClass = `ace-${THEME_NAME}`;
    exports.cssText = style;
    
    // Use setTimeout to defer DOM manipulation
    setTimeout(() => {
      dom.importCssString(exports.cssText, exports.cssClass, false);
    }, 0);
  }
);

class BetterGithubDark {
  constructor() {
    this.onThemeChange = this.onThemeChange.bind(this);
    this.initialized = false;
  }

  async init($page, cacheFile, cacheFileUrl) {
    if (this.initialized) return;
    
    try {
      // Add theme to the list
      const themeCaption = THEME_NAME.split("-")
        .map(name => name[0].toUpperCase() + name.slice(1))
        .join(" ");

      const themeEntry = {
        caption: themeCaption,
        theme: `ace/theme/${THEME_NAME}`,
        isDark: THEME_IS_DARK
      };

      if (!themesList.some(theme => theme.theme === themeEntry.theme)) {
        themesList.push(themeEntry);
      }

      // Set theme if it's currently selected
      const currentTheme = settings.get("editorTheme");
      if (currentTheme === THEME_NAME) {
        // Defer theme setting
        setTimeout(() => {
          editor.setTheme(`ace/theme/${THEME_NAME}`);
        }, 0);
      }

      // Add event listener
      settings.on("update", this.onThemeChange);
      this.initialized = true;
    } catch (error) {
      console.error("Theme initialization error:", error);
      acode.alert("Warning", "Please restart acode");
    }
  }

  async destroy() {
    if (!this.initialized) return;
    
    settings.off("update", this.onThemeChange);
    
    const themeIndex = themesList.findIndex(
      t => t.theme === `ace/theme/${THEME_NAME}`
    );
    
    if (themeIndex !== -1) {
      themesList.splice(themeIndex, 1);
    }
    
    this.initialized = false;
  }

  onThemeChange(value) {
    if (typeof value !== "string") return;
    
    let themeName = value;
    if (value.startsWith("ace/theme/")) {
      themeName = value.replace("ace/theme/", "");
    }

    // Defer theme setting
    setTimeout(() => {
      editor.setTheme(`ace/theme/${themeName}`);
      settings.update({ editorTheme: themeName });
    }, 0);
  }
}

// Plugin initialization
if (window.acode) {
  const betterGithubDark = new BetterGithubDark();
  
  acode.setPluginInit(
    plugin.id,
    async (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
      betterGithubDark.baseUrl = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
      await betterGithubDark.init($page, cacheFile, cacheFileUrl);
    }
  );

  acode.setPluginUnmount(plugin.id, () => {
    betterGithubDark.destroy();
  });
}