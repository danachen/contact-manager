App = {
  // Helper methods
  getTags() {
    for (const contact of this.contactList) {
      if (!contact['tags']) {
        continue;
      } else {
        let tags = contact['tags'].split(', ');
        for (let tag of tags) {
          // TODO: need to delete the entries with tags that are ', ' separated, then it should work
          if (this.tagList.indexOf(tag) < 0) {
            this.tagList.push(tag);
          }
        }
      }
     
    }
  },

  showFormTemplate() {
    this.form.hidden = false;
    this.tagField.value = this.tagList.join(',')
  },  

  hideFormTemplate() {
    this.form.hidden = true;
  },
  
  render() {
    let contactTemplate = document.getElementById('contact-template').innerHTML;
    let compiledContactTemplate = Handlebars.compile(contactTemplate);
    return compiledContactTemplate;
  },

  renderContacts() {
    this.template = this.render();
    document.querySelector('.contact-list-container').innerHTML = this.template(this.contactList);
  },

  resetForm() {
    // TODO: reset form
  },
  
  // Main methods
  getAllContacts() {
    const request = new XMLHttpRequest();
    request.open('GET', this.url + '/api/contacts');
    request.responseType = 'json';

    request.addEventListener('load', () => {
      this.contactList = request.response;
      this.renderContacts();
      this.getTags();
      document.querySelector('.no-contact-message').style.visibility="none";
    })
    request.send();
  },

  formValidation() {
    const contactElements = document.querySelectorAll('.contact');
    let passed = true;
    for (const el of contactElements) {
      console.log(el, el.checkValidity());
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
        this.resetForm();
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

    console.log(json);
    const request = new XMLHttpRequest();
    request.open('PUT', this.url + `/api/contacts/${currentContactId}`);
    request.setRequestHeader('Content-Type', 'application/json');
    request.addEventListener('load', () => {
      console.log(request.status);
      if (request.status === 201    ) {
        console.log('edit successful');
      }
    })
    request.send(json);
  },

  loadCurrentContactInfo(contact) {
    this.addContactBoolean = false;
    let form = document.getElementById('add');
    form.hidden = false;
    [fullName, email, phone, tags] = [contact['full_name'], contact['email'], contact['phone_number'], contact['tags']];
    form.querySelector('.contact-name').value = fullName;
    form.querySelector('.contact-email').value = email;
    form.querySelector('.contact-phone').value = phone;
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
      console.log(this.url);
      if (request.status === 204) {
        console.log('delete successful');
      }
    });
    request.send();
  },

  handleClick(e) {
    e.preventDefault();
    console.log(e.target.id);
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
      console.log('update handle works');
      this.getExistingContact(e, this.loadCurrentContactInfo);
    } else if (e.target.id === 'delete-contact') {
      this.getExistingContact(e, this.deleteContact);
    }
  },

  handleEnter(e) {
    if (e.key === 'Enter') {
      console.log('return key is pressed');
    }
  },

  bindEvents() {
    document.addEventListener('click', this.handleClick.bind(this));
    document.addEventListener('keypress', this.handleEnter.bind(this));
  },

  async init() {
    this.addFormElements = document.querySelectorAll('.add-contact');
    this.submitForm = document.getElementById('submit');
    this.cancelFormElement = document.querySelectorAll('.cancel');
    this.form = document.getElementById('add');
    this.tagField = document.querySelector('.contact-tags');
    this.url = 'http://localhost:3000';
    this.contactList;
    this.template;
    this.currentContact;
    this.tagList = [];
    this.addContactBoolean = true;
    this.bindEvents();
    this.getAllContacts();
    // this.getForm = await this.showFormTemplate();
  },
}

document.addEventListener('DOMContentLoaded', () => {
  App.init();
})
