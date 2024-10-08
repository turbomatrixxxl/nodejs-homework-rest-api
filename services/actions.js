const path = require("path");
const fs = require("fs").promises; // Use the promise-based version of fs

const contactsPath = path.join(__dirname, "..", "models", "contacts.json");
// console.log(tasksPath);

//! list contacts
async function listContacts() {
  try {
    const data = await fs.readFile(contactsPath, "utf-8");
    const contacts = JSON.parse(data);

    // console.table(contacts);
    return contacts;
  } catch (error) {
    console.log("Error on reading file...!");
    throw error;
  }
}

// listContacts();

//! list contact by id
async function listContactById(contactId) {
  try {
    const data = await fs.readFile(contactsPath, "utf-8");
    const contacts = JSON.parse(data);

    const contact = contacts.find((contact) => contact.id === contactId);

    if (!contact) {
      // console.log(`Contact with id ${contactId} does not exists !`);
      return false;
    }

    // console.table(contact);
    return contact;
  } catch (error) {
    console.log("Error on reading file...!");
    throw error;
  }
}

// listContactById({ id: "AeHIrLTr6JkxGE6SN-0Rw" });

//! add contact
async function addContact({ name, email, phone }) {
  if (!name) {
    // console.log("Please enter name ...!");

    return;
  }
  if (!email) {
    // console.log("Please enter email ...!");

    return;
  }

  if (!phone) {
    // console.log("Please enter phone ...!");

    return;
  }

  try {
    const data = await fs.readFile(contactsPath, "utf-8");
    const contacts = JSON.parse(data);

    const isName = contacts.some((contact) => contact.name === name);

    if (isName) {
      return "nameIs";
    }

    const isEmail = contacts.some((contact) => contact.email === email);

    if (isEmail) {
      return "emailIs";
    }

    const isPhone = contacts.some((contact) => contact.phone === phone);

    if (isPhone) {
      return "phoneIs";
    }

    const newContact = {
      id: String(Date.now()),
      name: name,
      email: email,
      phone: phone,
    };

    contacts.push(newContact);

    await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));

    // console.table(contacts);
    return contacts;
  } catch (error) {
    console.log("Error on reading file...!", error);
    throw error;
  }
}

//! delete contact
async function deleteContact(id) {
  try {
    const data = await fs.readFile(contactsPath, "utf-8");
    const contacts = JSON.parse(data);

    const isId = contacts.some((task) => id === task.id);
    if (!isId) {
      console.log("This user does not exists...!");

      return "isNot";
    }

    const newContacts = contacts.filter((contact) => contact.id !== id);

    await fs.writeFile(contactsPath, JSON.stringify(newContacts, null, 2));

    // console.table(newContacts);
    return newContacts;
  } catch (error) {
    console.log("Error on reading file...!", error);
    throw error;
  }
}

//! Inlocuieste resursa partial  cu findIndex
async function patchContact({ id, name, email, phone }) {
  try {
    const data = await fs.readFile(contactsPath, "utf-8");
    const contacts = JSON.parse(data);
    // console.log(contacts);

    const contactIndex = contacts.findIndex((contact) => contact.id === id);

    if (contactIndex === -1) {
      // console.log("This contact does not exists...!");
      return false;
    }

    if (name !== undefined) {
      contacts[contactIndex].name = name;
    }

    if (email !== undefined) {
      contacts[contactIndex].email = email;
    }

    if (phone !== undefined) {
      contacts[contactIndex].phone = phone;
    }

    await fs.writeFile(contactsPath, JSON.stringify(contacts, null, 2));

    return contacts;
  } catch (error) {
    console.log("Error on patching file...!", error);
    throw error;
  }
}

module.exports = {
  listContacts,
  listContactById,
  addContact,
  deleteContact,
  patchContact,
};
