
class Todo {
    constructor(data, readonly) {
        this._data = data ?? [];
        this._readonly = readonly ?? false;
    }

    addItem(text) {
        if (this._readonly == true) {
            alert('Список только для чтения. Добавление, изменение ЗАПРЕЩЕНО');
            return;
        }

        let result = this._data.find(elem => elem.text == text);
        if (result) {
            throw new Error('Такое дело уже есть');
        }

            this._data.push({
                id: creatId(),
                text: text.trim(),
                completed: false,
                readonly: false
            });

        this._triggerEvent('change');
    }

    changeItemText(id, text) {
        if (this._readonly == true) {
            alert('Список только для чтения. Изменение ЗАПРЕЩЕНО');
            return;
        }

        let result = this._data.find(elem => elem.id == id);

        if (result.readonly == true) {
            alert('Этот элемент только для чтения. Изменение ЗАПРЕЩЕНО');
            return;
        }
        result.text = text;

        this._triggerEvent('change');
    }

    deleteItem(id) {
        if (this._readonly == true) {
            alert('Список только для чтения. Удаление ЗАПРЕЩЕНО');
            return;
        }

        let result = this._data.find(elem => elem.id == id);

        if (!result) {
            console.log('Такого элемента нет');
            return;
        } else if (result.readonly == true) {
            console.log('Элемент только для чтения. Удаление невозможно');
            return
        }

        let numIndex = this._data.findIndex(elem => elem.id == id);

        this._data.splice(numIndex, 1);

        this._triggerEvent('change');
    }

    clear() {
        if (this._readonly == true) {
            alert('Список только для чтения. Добавление, изменение ЗАПРЕЩЕНО');
            return;
        }

        let boolean = this._data.some(elem => elem.readonly == true);

        if (boolean == true) {
            alert('Удаление невозможно, один из объектов только для чтения');
            return
        }

        this._data = [];

        this._triggerEvent('change');
    }

    getAllItems() {
        return JSON.parse(JSON.stringify(this._data));
    }

    isReadonly() {
        return this._readonly;
    }

    makeReadonly() {
        this._readonly = true;
        this._triggerEvent('change');
    }

    makeItemReadonly(id) {
        let result = this._data.find(elem => elem.id == id);
        if (result) {
            result.readonly = true;

            this._triggerEvent('change');
        }
    }

    makeEditable() {
        this._readonly = false;
        this._triggerEvent('change');
    }

    makeItemEditable(id) {
        let result = this._data.find(elem => elem.id == id);
        if (result) {
            result.readonly = false;

            this._triggerEvent('change');
        }
    }

    makeItemCompleted(id) {
        let result = this._data.find(elem => elem.id == id);
        result.completed = true;

        this._triggerEvent('change');
    }

    makeItemUnCompleted(id) {
        let result = this._data.find(elem => elem.id == id);
        result.completed = false;

        this._triggerEvent('change');
    }

    addEventListener(eventName, func) {
        window.addEventListener(`model: ${eventName}`, func);
    }

    removeEventListener(eventName, func) {
        window.removeEventListener(`model: ${eventName}`, func);
    }

    _triggerEvent(eventName) {
        window.dispatchEvent(new Event(`model: ${eventName}`))
    }

    _checkStatus(id) {
        let result = this._data.find(elem => elem.id == id);
    }
}

class Storage {
    constructor(key) {
        this._key = key;

        if (typeof this._key !== "string") {
            this._key = this._key.toString();
        }
    }

    setData(data) {
        localStorage.setItem(this._key, JSON.stringify(data))
    }

    getData() {
        return JSON.parse(localStorage.getItem(this._key))
    }
}

class View {
    constructor(todo) {
        this._todo = todo;
        this._htmlElement = document.createElement('div');
        this._htmlElement.id = creatId();                                     
        this._render = this._render.bind(this);
    }

    initialize() {
        this._todo.addEventListener('change', this._render);
        document.body.append(this._htmlElement);

        this._render();
    }

    destroy() {
        this._todo.removeEventListener('change', this._render);
        this._htmlElement.remove();
    }

    _render() {
        let todoItems = this._todo.getAllItems();
        let todoItemsReadonly = this._todo.isReadonly();

        let html = '';

        html += `
        <div class="container">
            <div class="header">                                          
                <input type="text" id="tagInput_${this._htmlElement.id}" class="tag-input" ${todoItemsReadonly ? 'disabled' : ''} placeholder="Your tag name"> 
                <button id="tagAdd_${this._htmlElement.id}" class="tag-add" ${todoItemsReadonly ? 'disabled' : ''}>+</button>
            </div>
            <div class="tags">
                <span class="notification">Tag list</span>
                <ul id="tagsList_${this._htmlElement.id}" class="tags-list">`
        for (let todoItem of todoItems) {
            html += `<li id="tagItem_${todoItem.id}"> ${todoItem.text} <button class="close-dagger delete" ${todoItemsReadonly || todoItem.readonly ? 'disabled' : ''}>&#10006</button></li>`
        }
        html += `</ul> 
            </div>
        </div>
        `
        this._htmlElement.innerHTML = html;

        this._subscribeOnUserAction();
    }

    _subscribeOnUserAction() {
        let todoItems = this._todo.getAllItems();
        let button = document.getElementById(`tagAdd_${this._htmlElement.id}`);
        let input = document.getElementById(`tagInput_${this._htmlElement.id}`);
        let that = this;

        button.addEventListener('click', function () {
            let inputText = input.value;

            if (!inputText) return;

            let arr = inputText.split(',');

            arr.forEach(elem => {
                elem = elem.trim();
                that._todo.addItem(elem);
            });
        });

        input.addEventListener('keydown', function (event) {

            let inputText = input.value;

            if (!inputText) return;

            if (event.keyCode === 13) {
                let arr = inputText.split(',');

                if (arr.length > 0) {
                    arr.forEach(elem => {
                        elem = elem.trim();
                        that._todo.addItem(elem);
                    });
                }
            }
        });

        todoItems.forEach(todoItem => {
            let li = document.getElementById(`tagItem_${todoItem.id}`);
            let closeButton = li.querySelector('button.close-dagger.delete');

            closeButton.addEventListener('click', function () {
                that._todo.deleteItem(todoItem.id);
            });
        });
    }
};

let storage = new Storage('todoStorage');
let objStorage = storage.getData();

let data = objStorage?.data;
let readonly = objStorage?.readonly;

let todo = new Todo(data, readonly);
let view = new View(todo);
view.initialize();

todo.addEventListener('change', function () {
    let objForStorage = {
        data: todo.getAllItems(),
        readonly: todo.isReadonly(),
    };

    storage.setData(objForStorage);
});


function creatId() {
    return (Math.random() + 1).toString(36).substring(7);
}

