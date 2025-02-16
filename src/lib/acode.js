import commands from "./commands";
import fsOperation from "../fileSystem/fsOperation";
import Url from "../utils/Url";
import settingsPage from "../components/settingPage";

export default class Acode {
  #pluginsInit = {};
  #pluginUnmount = {};
  #formatter = [{
    id: 'default',
    name: 'Default',
    exts: ['*'],
    format: async () => {
      const { beautify } = ace.require('ace/ext/beautify')
      const cursorPos = editorManager.editor.getCursorPosition();
      beautify(editorManager.editor.session);
      editorManager.editor.gotoLine(cursorPos.row + 1, cursorPos.column);
    }
  }];

  exec(key, val) {
    if (key in commands) {
      return commands[key](val);
    } else {
      return false;
    }
  }

  get exitAppMessage() {
    const numFiles = editorManager.hasUnsavedFiles();
    if (numFiles) {
      return strings['unsaved files close app'];
    }
  }

  setLoadingMessage(message) {
    document.body.setAttribute('data-small-msg', message);
  }

  setPluginInit(id, initFunction) {
    this.#pluginsInit[id] = initFunction;
  }

  setPluginUnmount(id, unmountFunction) {
    console.log('unmountPlugin', id);
    this.#pluginUnmount[id] = unmountFunction;
  }
  /**
   * 
   * @param {string} id plugin id
   * @param {string} baseUrl local plugin url
   * @param {HTMLElement} $page 
   */
  initPlugin(id, baseUrl, $page, options) {
    if (id in this.#pluginsInit) {
      this.#pluginsInit[id](baseUrl, $page, options);
    }
  }

  unmountPlugin(id) {
    if (id in this.#pluginUnmount) {
      this.#pluginUnmount[id]();
      fsOperation(Url.join(CACHE_STORAGE, id)).delete();
    }
  }

  registerFormatter(id, extensions, format) {
    this.#formatter.unshift({
      id,
      exts: extensions,
      format,
    });
  }

  async format() {
    const file = editorManager.activeFile;
    const { getModeForPath } = ace.require('ace/ext/modelist');
    const { name } = getModeForPath(file.name);
    const formatterId = appSettings.value.formatter[name];
    const formatter = this.#formatter.find(({ id }) => id === formatterId);

    if (formatter) {
      await formatter.format();
    }
  }

  fsOperation(file) {
    return fsOperation(file);
  }

  get formatters() {
    return this.#formatter.map(({ id, name, exts }) => ({
      id,
      name: name || id,
      exts,
    }));
  }
}