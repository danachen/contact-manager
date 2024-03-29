import debounce from './debounce.js';

const App = {
  renderTags() {
    for (let tag of Object.keys(this.tagList)) {
      const li = document.createElement('li');
      li.classList.add('list-of-tags');
      if (tag === 'all') {
        li.style.backgroundColor='lightgray';
      } else {
        li.style.backgroundColor='white';
      }
      
      li.innerText = tag;
      this.tagCloudSearch.append(li);

      if (tag === 'all') continue;
      
      const li2 = document.createElement('li');
      li2.classList.add('list-of-tags-add-contact');
      li2.classList.add('d-inline');
      li2.style.backgroundColor='white';
      li2.innerText = tag;
      this.tagCloudAddNewContact.append(li2);
    }
  },

  getTags() {
    const request = new XMLHttpRequest();
    request.open('GET', this.url + "/api/contacts");
    request.responseType = 'json';

    request.addEventListener('load', () => {
      let listOfTags = Array.from(request.response).map(item => item.tags);
      for (let tagStr of listOfTags) {
        let tagArr = tagStr.split(',');
        for (let tag of tagArr) {
          if (Object.keys(this.tagList).indexOf(tag) < 0) {
            this.tagList[tag] = false;
          }
        }
      }
      this.renderTags();
    })
    request.send();
  },

  showFormTemplate() {
    this.form.hidden = false;
    this.tagField.value = this.tagList.join(',')
  },  

  hideFormTemplate() {
    this.form.hidden = true;
  },
  
  render() {
    let compiledContactTemplate = Handlebars.compile(this.contactTemplate);
    return compiledContactTemplate;
  },

  renderContacts(contacts) {
    this.template = this.render();
    document.querySelector('.contact-list-container').innerHTML = this.template(contacts);
  },

  // Main methods
  getAllContacts() {
    const request = new XMLHttpRequest();
    request.open('GET', this.url + '/api/contacts');
    request.responseType = 'json';

    request.addEventListener('load', () => {
      this.contactList = request.response;
      this.renderContacts(this.contactList);
      this.getTags();
    })
    request.send();
  },

  formValidation() {
    const contactElements = document.querySelectorAll('.contact');
    let passed = true;
    for (const el of contactElements) {
      if (!el.checkValidity()) {
        el.parentElement.lastElementChild.innerHTML = el.validationMessage;
        passed = false;
      }
    }
    return passed;
  },

  addContact() {
    const data = new FormData(this.form);
    let object = {};
    data.forEach((value, key) => object[key]=value);
    data['id'] = this.currentContactId;
    const json = JSON.stringify(object);

    const request = new XMLHttpRequest();
    request.open('POST', this.url + '/api/contacts');
    request.setRequestHeader('Content-Type', 'application/json');
    request.addEventListener('load', () => {
      if (request.status === 201) {
        window.location.href = "/"
      }
    })
    request.send(json);
  },

  editContact() {
    const data = new FormData(this.form);
    let object = {};
    const currentContactId = Number(this.currentContact['id']);
    data.set('id', currentContactId);
    data.forEach((value, key) => object[key]=value);
    const json = JSON.stringify(object);

    const request = new XMLHttpRequest();
    request.open('PUT', this.url + `/api/contacts/${currentContactId}`);
    request.setRequestHeader('Content-Type', 'application/json');
    request.addEventListener('load', () => {
      if (request.status === 201) {
        window.location.href = "/"
      }
    })
    request.send(json);
  },

  loadCurrentContactInfo(contact) {
    let form = document.getElementById('add');
    form.hidden = false;
    const {full_name, email, phone_number, tags} = contact;
    form.querySelector('.contact-name').value = full_name;
    form.querySelector('.contact-email').value = email;
    form.querySelector('.contact-phone').value = phone_number;
    form.querySelector('.contact-tags').value = tags;
  },

  getExistingContact(e, callback) {
    const currentContactId = Number(e.target.parentElement.parentElement.parentElement.getAttribute('value'));

    const request = new XMLHttpRequest();
    request.open('GET', `/api/contacts/${currentContactId}`);
    request.setRequestHeader('Content-Type', 'application/json');
    request.addEventListener('load', () => {
      this.currentContact = JSON.parse(request.response);
      this.currentContactId = this.currentContact['id'];
      callback(this.currentContact);
    })
    request.send();
  },

  deleteContact(contact) {
    const id = contact['id'];
    const request = new XMLHttpRequest();
    request.open('DELETE', `/api/contacts/${id}`);
    request.addEventListener('load', () => {
      if (request.status === 204) {
        window.location.href = "/"
      }
    });
    request.send();
  },

  cleanName(name) {
    return name.trim().toLowerCase();
  },

  fetchMatches(query, callback) {
    let request = new XMLHttpRequest();

    request.open('GET', `${this.url}${encodeURIComponent(query)}`);
    request.responseType = 'json';

    request.addEventListener('load', () => {
      callback(request.response);
    });

    request.send();
  },

  filterContactsByTags(e) {
    if (e.target.style.backgroundColor === 'white') {
      e.target.style.backgroundColor = 'lightgray';
    } else if (e.target.style.backgroundColor = 'lightgray') {
      e.target.style.backgroundColor = 'white';
    }
    
    const tagKey = e.target.textContent;
    this.tagList[tagKey] = !this.tagList[tagKey];
    const filteredTags = Object.keys(this.tagList).filter(tag => this.tagList[tag] === true);
    this.filteredContacts = [];
    
    for (let contact of this.contactList) {
      for (let tag of filteredTags) {
        if (contact.tags.includes(tag)) {
          if (!this.filteredContacts.includes(contact)) {
            this.filteredContacts.push(contact);
          }
        }
      }
    }

    if (this.tagList['all']) this.filteredContacts = this.contactList;
    this.renderContacts(this.filteredContacts);
  },

  addTagToForm(e) {
    const tag = e.target.textContent;
    if (document.getElementsByClassName('contact-tags')[0].value) {
      document.getElementsByClassName('contact-tags')[0].value += ',' + tag;
    } else {
      document.getElementsByClassName('contact-tags')[0].value += tag;
    }
  },

  handleSearch() {
    const currentSearchStr = this.cleanName(this.searchInput.join(''));
    const regex = new RegExp(`\w?${currentSearchStr}\w?`);
    this.filteredContacts = this.contactList.filter(contact => this.cleanName(contact['full_name']).match(regex));
    this.renderContacts(this.filteredContacts);
  },

  handleKeydown(e) {
    if (e.keyCode >= 65 && e.keyCode <= 90) {
      this.searchInput.push(e.key);
      this.currentSearchIndex = this.searchInput.length;
    } else if (e.key === 'Backspace') {
      this.currentSearchIndex -= 1;
      this.searchInput.splice(this.currentSearchIndex, 1);
    } else if (e.key === 'ArrowLeft') {
      if (this.currentSearchIndex <= 0) {
        this.currentSearchIndex = 0;
      } else if (this.currentSearchIndex > this.searchInput.length) {
        this.currentSearchIndex = this.searchInput.length;
      } else {
        this.currentSearchIndex -= 1;
      }
    } else if (e.key === 'ArrowRight') {
      if (this.currentSearchIndex < 0) {
        this.currentSearchIndex = 0;
      } else if (this.currentSearchIndex >= this.searchInput.length) {
        this.currentSearchIndex = this.searchInput.length;
      } else {
        this.currentSearchIndex += 1;
      }
    }

    this.keysPressed[e.key] = true;

    if (e.key === 'Meta') {
      if (this.keysPressed['Backspace'] && e.key == 'Meta') {
        this.searchInput = [];
        this.currentSearchIndex = 0;
        this.renderContacts(this.contactList);
      }
    }
  },

  handleClick(e) {
    e.preventDefault();
    if (e.target.id === "add-contact") {
      this.showFormTemplate();
    } else if (e.target.id === "cancel") {
      this.hideFormTemplate();
    } else if (e.target === this.submitForm) {
      if (this.formValidation()) {
        if (this.addContactBoolean) {
          this.addContact();
        } else {
          this.editContact();
          this.addContactBoolean = true;
        }
      };
    } else if (e.target.id === 'update-contact') {
      this.form.querySelector('.contact-switch').textContent = "Update";
      this.addContactBoolean = false;
      this.getExistingContact(e, this.loadCurrentContactInfo);
    } else if (e.target.id === 'delete-contact') {
      this.getExistingContact(e, this.deleteContact);
    } else if (e.target.tagName === 'LI') {
      if (Array.from(e.target.classList).includes('list-of-tags')) {
        this.filterContactsByTags(e);
      } else if (Array.from(e.target.classList).includes('list-of-tags-add-contact')) {
        this.addTagToForm(e);
      }
    }
  },

  handleKeyup(e) {
    delete this.keysPressed[e.key];
  },

  bindEvents() {
    document.addEventListener('click', this.handleClick.bind(this));
    document.addEventListener('keydown', this.handleKeydown.bind(this));
    document.addEventListener('keyup', this.handleKeyup.bind(this));
    document.querySelector('input').addEventListener('input', this.handleSearch.bind(this));
  },

  init() {
    this.addFormElements = document.querySelectorAll('.add-contact');
    this.submitForm = document.getElementById('submit');
    this.cancelFormElement = document.querySelectorAll('.cancel');
    this.form = document.getElementById('add');
    this.tagField = document.querySelector('.contact-tags');
    this.tagCloudSearch = document.querySelector('.tag-search');
    this.tagCloudAddNewContact = document.querySelector('.tag-list');
    this.url = 'http://localhost:3000';
    this.contactList;
    this.template;
    this.currentContact;
    this.tagList = {all: true};
    this.addContactBoolean = true;
    this.getAllContacts();
    this.searchInput = [];
    this.currentSearchIndex = this.searchInput.length;
    this.handleSearch = debounce(this.handleSearch.bind(this), 300);
    this.bindEvents();
    this.filteredContacts = this.contactList;
    this.contactTemplate = document.getElementById('contact-template').innerHTML;
    this.tagsClickedOn = [];
    this.keysPressed = {};
  },
}

document.addEventListener('DOMContentLoaded', () => {
  App.init();
})