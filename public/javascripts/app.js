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

    for (const el of contactElements) {
      if (!el.checkValidity()) {
        el.parentElement.lastElementChild.innerHTML = el.validationMessage;
      }
    }
  },

  addContact() {
    const data = new FormData(this.form);
    let object = {};
    data.forEach((value, key) => object[key]=value);
    const json = JSON.stringify(object);

    const request = new XMLHttpRequest();
    request.open('POST', this.url + '/api/contacts');
    request.setRequestHeader('Content-Type', 'application/json');
    request.addEventListener('load', () => {
      if (request.status === 201) {
        console.log('add successful');
      }
    })
    request.send(json);
  },

  editContact() {
    const data = new FormData(this.form);
    let object = {};
    data.forEach((value, key) => object[key]=value);
    const json = JSON.stringify(object);
    const currentContactId = Number(this.currentContact['id']);

    const request = new XMLHttpRequest();
    request.open('PUT', this.url + `/api/contacts/${currentContactId}`);
    request.setRequestHeader('Content-Type', 'application/json/');
    request.addEventListener('load', () => {
      console.log(request.status);
      if (request.status === 201  ) {
        console.log('edit successful');
      }
    })
    request.send(json);
  },

  loadCurrentContactInfo() {
    this.showFormTemplate();
    this.addContactBoolean = false;
    let form = document.getElementById('add');
    [fullName, email, phone, tags] = [this.currentContact['full_name'], this.currentContact['email'], this.currentContact['phone_number'], this.currentContact['tags']];
    form.querySelector('.contact-name').value = fullName;
    form.querySelector('.contact-email').value = email;
    form.querySelector('.contact-phone').value = phone;
    form.querySelector('.contact-tags').value = tags;
  },

  getExistingContact(e) {
    const currentContactId = Number(e.target.parentElement.parentElement.parentElement.getAttribute('value'));

    const request = new XMLHttpRequest();
    request.open('GET', this.url + `/api/contacts/${currentContactId}`);
    request.setRequestHeader('Content-Type', 'application/json');
    request.addEventListener('load', () => {
      this.currentContact = JSON.parse(request.response);
      this.loadCurrentContactInfo();
    })
    request.send();
  },

  handleClick(e) {
    e.preventDefault();
    // TODO: check why handleClick is no longer working with submission or resubmission(edit)
    if (e.target.id === "add-contact") {
      // if (this.addContactBoolean) {
        if (Array.from(this.addFormElements).indexOf(e.target) > -1) {
          this.showFormTemplate();
        } else if (Array.from(this.cancelFormElement).indexOf(e.target) > -1) {
          this.hideFormTemplate();
        } else if (this.submitForm === e.target) {
          this.formValidation();
          this.addContact();
        }
      } 
      // else {
      //   console.log('edit button clicked');
      //   this.editContact();
      // }
    // } 
    else if (e.target.id === 'update-contact') {
      console.log('handleClick(e) works')
      this.getExistingContact(e);
    } else if (e.target.id === 'delete-contact') {
      console.log('delete contact');
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

  init() {
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
  },
}

document.addEventListener('DOMContentLoaded', () => {
  App.init();
})
