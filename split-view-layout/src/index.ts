import "@webcomponents/webcomponentsjs/webcomponents-bundle";
import "@webcomponents/webcomponentsjs/custom-elements-es5-adapter.js";

import { OrientationType } from "./types";

const CONTAINER_BORDER = 1;

const createTemplate = (childNodes: Element[]): HTMLTemplateElement => {
  const template = document.createElement("template");
  const style = document.createElement("style");
  style.textContent = `
    :host{
      display: flex;
      height: 300px;
      width: 600px;
      border: ${CONTAINER_BORDER}px solid #000;
    }

    
    :host([hidden]) {
      display: none !important;
    }

    :host([orientation="vertical"]){
      flex-direction: column;
    }

    .splitter{
      width: 4px;
      height: 100%;
      background-color: #aaa;
      user-select: none;  
      position: relative;
    }

    :host([orientation="vertical"]) .splitter{
      height: 4px;
      width: 100%;
     
    }

    
    .splitter:hover{
      background-color: #bbb;
      cursor: col-resize;
    }

    .splitter::after{
      position: absolute;
      content: "";
      display: block;
      width: calc(100% + 5px);
      height: 20px;
      background-color: #000;
      transform: translate(-50%, -50%);
      top: 50%;
      left:50%;
      border-radius: 5px;
      cursor: col-resize;
    }

    :host([orientation="vertical"]) .splitter::after{
      width: 20px;
      height: calc(100% + 5px);
      // left: 50%;
    }


    :host([orientation="vertical"])  .splitter:hover, :host([orientation="vertical"])  .splitter::after{
      cursor: row-resize;
    }

    .splitter:hover.splitter::after{
      opacity: 0.5;
    }


    .section{
     
      overflow: auto;
    }
  `;
  template.content.appendChild(style);
  console.log(childNodes);
  let id = 0;
  for (const child of childNodes.slice(0, childNodes.length - 1)) {
    // console.log(child);
    template.innerHTML += `
      <div class="section" id="section-${id}">${child.innerHTML}</div>
      <div class="splitter" id="splitter-${id}"></div>
    `;
    id++;
  }

  template.innerHTML += `
    <div class="section" id="section-${id}">${
    childNodes[childNodes.length - 1].innerHTML
  }</div>
  `;

  return template;
};

const getSizeInInt = (ele: HTMLElement, type: "width" | "height") =>
  parseInt(ele.style[type].replace("px", ""));

class SideViewLayout extends HTMLElement {
  orientation: OrientationType = "vertical";
  self: any = null;
  observer!: MutationObserver;
  childElements: HTMLDivElement[] = [];
  splitters: HTMLDivElement[] = [];
  shadow: ShadowRoot | null = null;

  constructor() {
    super();
    // this.self=self;
    this.shadow = this.attachShadow({ mode: "open" });
    this.onNewChildAdded = this.onNewChildAdded.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.initChildSize = this.initChildSize.bind(this);
    this.attachEventListenersToSplitters =
      this.attachEventListenersToSplitters.bind(this);
  }

  connectedCallback() {
    this.orientation = (this.getAttribute("orientation") ||
      "vertical") as OrientationType;
    this.observer = new MutationObserver(this.onNewChildAdded);
    this.observer.observe(this, { childList: true });
    // this.attachSplitters(childNodes);
  }

  onNewChildAdded(mutations: MutationRecord[]) {
    // this.childElements=
    console.log(mutations);
    const newChildren: HTMLDivElement[] = [];
    for (const mutation of mutations) {
      if (mutation.addedNodes) {
        let childNodes = Array.from(mutation.addedNodes);
        console.log(childNodes);
        childNodes = childNodes.filter((node) => node.nodeType === 1);
        newChildren.push(...(childNodes as HTMLDivElement[]));
        // this.childElements = childNodes as Element[];
        // this.assingToShadowRoot(childNodes);
      }
    }
    const template = createTemplate(newChildren);
    this.childElements = Array.from(template.content.children).filter(
      (node) => node.className === "section"
    ) as HTMLDivElement[];

    this.splitters = Array.from(template.content.children).filter(
      (node) => node.className === "splitter"
    ) as HTMLDivElement[];
    // console.log(template.content.children);
    this.initChildSize(this.childElements);
    this.shadow?.appendChild(template.content.cloneNode(true));
    this.attachEventListenersToSplitters();
  }

  initChildSize(childNodes: HTMLDivElement[]) {
    for (const child of childNodes) {
      if (this.orientation === "vertical") {
        this.setHeight(child, 100 / childNodes.length);
      } else {
        this.setWidth(child, 100 / childNodes.length);
      }
    }
  }

  handleMouseDown(e: MouseEvent, splitter: HTMLDivElement) {
    console.log("first");
    const mousePosition = [e.clientX, e.clientY];
    const firstSection = splitter.previousSibling
      ?.previousSibling as HTMLDivElement;
    const nextSection = splitter.nextSibling?.nextSibling as HTMLDivElement;

    const splitterRect = splitter.getBoundingClientRect();
    const rect1 = firstSection.getBoundingClientRect();
    const rect2 = nextSection.getBoundingClientRect();

    let h1 = rect1.height;
    let h2 = rect2.height;
    let w1 = rect1.width;
    let w2 = rect2.width;

    // console.log(this.getBoundingClientRect());
    // console.log(rect1.height, rect2.height);
    const totalContainerSize =
      this.orientation === "vertical"
        ? rect1.height + rect2.height + splitterRect.height
        : rect1.width + rect2.width + splitterRect.width;

    const percentageArea =
      (totalContainerSize /
        (this.orientation === "horizontal"
          ? this.getBoundingClientRect().width -
            CONTAINER_BORDER * 1.92 -
            splitterRect.width
          : this.getBoundingClientRect().height -
            CONTAINER_BORDER * 1.92 -
            splitterRect.height)) *
      100;

    console.log(percentageArea);

    const handleMoveMove = (e: MouseEvent) => {
      let diff = 0;
      // console.log(firstSection.style.height, nextSection.style.height);
      if (this.orientation === "vertical") {
        diff = e.clientY - mousePosition[1];
        console.log(diff);
        const newH1 = ((h1 + diff) * percentageArea) / totalContainerSize;
        const newH2 = ((h2 - diff) * percentageArea) / totalContainerSize;

        console.log(newH1, newH2);
        firstSection.style.height = `${newH1}%`;

        nextSection.style.height = `${newH2}%`;
      } else {
        diff = e.clientX - mousePosition[0];
        const newW1 = ((w1 + diff) * percentageArea) / totalContainerSize;
        const newW2 = ((w2 - diff) * percentageArea) / totalContainerSize;
        firstSection.style.width = `${newW1}%`;
        nextSection.style.width = `${newW2}%`;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      e.preventDefault();
      console.log("up");
      window.onmousemove = null;
      window.onmouseup = null;
      // window.removeEventListener("onmousemove", handleMouseUp);
    };

    window.onmousemove = handleMoveMove.bind(this);
    window.onmouseup = handleMouseUp.bind(this);
  }

  attachEventListenersToSplitters() {
    // console.log(splitters);
    const splitters = this.shadow?.querySelectorAll(".splitter");
    console.log(this.shadow);

    if (!splitters) return;
    for (const splitter of splitters as NodeListOf<HTMLDivElement>) {
      // console.log(splitter);
      splitter.ondragstart = () => false;
      splitter.ondragend = () => false;

      splitter.onmousedown = (e: MouseEvent) => {
        console.log("mousedown");
        this.handleMouseDown(e, splitter as HTMLDivElement);
      };
    }

    // splitters[0].addEventListener("mousedown", (e: MouseEvent) => {
    //   console.log("mousedown");
    //   this.handleMouseDown(e, splitters[0] as HTMLDivElement);
    // });

    // splitters.forEach((splitter, index) => {
    //   console.log(splitter);
    //   splitter.addEventListener("click", (e) => {
    //     console.log("mousedown");
    //     // this.handleMouseDown(e, splitter, index);
    //   });
    // });
  }

  setHeight(ele: HTMLDivElement, height: number) {
    ele.style.height = `${height}%`;
  }

  setWidth(ele: HTMLDivElement, width: number) {
    ele.style.width = `${width}%`;
  }

  assingToShadowRoot(childNodes: Element[]) {}

  // attachSplitters(childNodes: Element[]) {
  //   const noOfSplitters = childNodes.length - 1;
  //   console.log(noOfSplitters);
  //   for (let i = 1; i < noOfSplitters; i++) {
  //     this.insertBefore(document.createElement("div"), childNodes[i]);
  //   }
  // }

  // render(){
  //   this.html="<div>Side View Layout</div>"
  // }
}

customElements.define("split-view-layout", SideViewLayout);
export default SideViewLayout;
