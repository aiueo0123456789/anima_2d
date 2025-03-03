export const connectingString = "><-/*+><";

class Menu {
    constructor(id, targetFn, depth) {
        this.id = id;
        this.children =[];
        this.htmlElement = document.createElement("li");
        this.htmlElement.id = id;
        this.htmlElement.className = "menu";

        this.menuName = document.createElement("button");
        this.menuName.textContent = id;

        this.childrenDiv = document.createElement("ul");
        this.childrenDiv.id = id + connectingString + "children";
        if (depth == 0) {
            this.childrenDiv.className = "facemenu";
        } else {
            this.childrenDiv.className = "submenu";
        }

        if (targetFn) {
            this.htmlElement.addEventListener("click", () => {
                targetFn();
            })
        }

        this.htmlElement.append(this.menuName, this.childrenDiv);
    }
}

class Milestone {
}

export function createMenuObjectsFromStruct(struct) {
    const menusObject = [];
    const createMenuObject = (parent,menu,depth = 0) => {
        const object = new Menu(menu.id, menu.targetFn, depth);
        menusObject.push(object);
        if (parent) parent.children.push(object);
        if (menu.children.length == 0) return ;
        for (const child of menu.children) {
            createMenuObject(object, child, depth + 1);
        }
        return ;
    }
    createMenuObject(null, struct);
    return menusObject;
}

export function updateForMenu(appendDiv,parent) {
    if (!parent) {
        return ;
    }
    document.getElementById(appendDiv).append(parent.htmlElement);
    if (parent.children.length == 0) return ;
    for (let i = 0; i < parent.children.length; i ++) {
        const child = parent.children[i];
        updateForMenu(parent.id + connectingString + "children", child);
    }
    return ;
}