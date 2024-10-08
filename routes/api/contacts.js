const express = require("express");

const router = express.Router();

const Joi = require("joi");

const {
  listContacts,
  listContactById,
  addContact,
  deleteContact,
  patchContact,
} = require("../../services/actions");

router.get("/", async (req, res, next) => {
  try {
    const contacts = await listContacts();
    res.status(200).json({
      status: "success",
      code: "200",
      message: "Contacts listed with success !!!",
      data: contacts,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      code: 500,
      message: "Contacts listing error...!",
    });
  }
});

router.get("/:contactId", async (req, res, next) => {
  const id = req.params.contactId;
  console.log(id);

  try {
    const contact = await listContactById(id);
    // console.table(contact);

    if (!contact) {
      return res.status(404).json({
        status: "error",
        code: 404,
        message: `Contact with id: ${id} does not exists...!`,
      });
    }

    res.status(201).json({
      status: "success",
      code: "201",
      message: `Contact with id: ${id}  found !!!`,
      data: contact,
    });
  } catch (error) {
    res.status(500).json({
      status: "fail",
      code: 500,
      message: `Contact searching error...!`,
    });
  }
});

const nameSchema = Joi.object({
  // eslint-disable-next-line prefer-regex-literals
  name: Joi.string().pattern(new RegExp("^[a-zA-Z]{3,30}$")),
});

const emailSchema = Joi.object({
  email: Joi.string().email({
    minDomainSegments: 2,
    tlds: { allow: ["com", "net"] },
  }),
});

const phoneSchema = Joi.object({
  phone: Joi.string().pattern(/^\+?\d{9,30}$/),
});

router.post("/", async (req, res, next) => {
  const { name, email, phone } = req.body;

  if (!name || name === null) {
    res.status(400).json({ message: "missing required name field" });
  }
  if (!email || email === null) {
    res.status(400).json({ message: "missing required email field" });
  }

  if (!phone || phone === null) {
    res.status(400).json({ message: "missing required phone number field" });
  }

  const { error } = nameSchema.validate({ name: name });
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  } else {
    const { error } = emailSchema.validate({ email: email });
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    } else {
      const { error } = phoneSchema.validate({ phone: phone });
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      } else {
        try {
          const newContacts = await addContact({
            name: name,
            email: email,
            phone: phone,
          });

          if (newContacts === "nameIs") {
            res.status(409).json({
              message:
                "The contact with this name already exists...! Please provide different info ! ",
            });
          } else if (newContacts === "emailIs") {
            res.status(409).json({
              message:
                "This email already exists...! Please provide different info ! ",
            });
          } else if (newContacts === "phoneIs") {
            res.status(409).json({
              message:
                "This phone number already exists...! Please provide different info ! ",
            });
          } else {
            res.status(201).json({
              status: "success",
              code: 201,
              message: `Success adding contact: name:${name}, email:${email}, phone:${phone} !`,
              data: newContacts,
            });
          }
        } catch (error) {
          res.status(500).json({
            status: "fail",
            code: 500,
            message: `Error adding contact...!`,
          });
        }
      }
    }
  }
});

router.delete("/:contactId", async (req, res, next) => {
  const id = req.params.contactId;

  try {
    const deletedContact = await deleteContact(id);
    if (deletedContact === "isNot") {
      res.status(404).json({ message: `contact with id:${id} not found` });
    } else {
      res.status(200).json({ message: `contact with id:${id} deleted` });
    }
  } catch (error) {
    res.status(500).json({
      status: "fail",
      code: 500,
      message: "Error deleting contact...!",
    });
  }
});

router.put("/:contactId", async (req, res, next) => {
  const id = req.params.contactId;
  const { name, email, phone } = req.body;

  if (!name && !email && !phone) {
    res.status(400).json({ message: "missing fields" });
    return;
  }

  try {
    const updatedContacts = await patchContact({
      id: id,
      name: name,
      email: email,
      phone: phone,
    });

    if (updatedContacts === false) {
      res.status(404).json({ message: "Contact for update is not found...!" });
    } else {
      const { error } = nameSchema.validate({ name: name });
      if (error) {
        return res.status(400).json({ error: error.details[0].message });
      } else {
        const { error } = emailSchema.validate({ email: email });
        if (error) {
          return res.status(400).json({ error: error.details[0].message });
        } else {
          const { error } = phoneSchema.validate({ phone: phone });
          if (error) {
            return res.status(400).json({ error: error.details[0].message });
          } else {
            res.status(200).json({
              status: "success",
              code: 200,
              message: `Success updating contact with id:${id}...!`,
              data: updatedContacts,
            });
          }
        }
      }
    }
  } catch (error) {
    res.status(500).json({
      status: "fail",
      code: 500,
      message: "Error updating contact...!",
    });
  }
});

module.exports = router;
