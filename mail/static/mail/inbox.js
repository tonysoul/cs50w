document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document
    .querySelector("#inbox")
    .addEventListener("click", () => load_mailbox("inbox"));
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);

  // By default, load the inbox
  load_mailbox("inbox");

  // bind form submint event
  bind_send_mail();
});

function compose_email() {
  clean_view();
  // Show compose view and hide other views
  document.querySelector("#compose-view").style.display = "block";
}

function load_mailbox(mailbox) {
  clean_view();
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";

  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  if (mailbox === "inbox") {
    load_mails("inbox");
  } else if (mailbox === "sent") {
    load_mails("sent");
  } else if (mailbox === "archive") {
    load_mails("archive");
  }
}

// send mail
function bind_send_mail() {
  document.querySelector("#compose-form").onsubmit = function () {
    const recipients = document.querySelector("#compose-recipients").value;
    const subject = document.querySelector("#compose-subject").value;
    const body = document.querySelector("#compose-body").value;

    fetch("/emails", {
      method: "POST",
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body,
      }),
    })
      .then((response) => response.json())
      .then((result) => {
        console.log(result);
        if (result.error) {
          show_errors(result.error);
        } else {
          document.querySelector("#sent").click();
        }
      });

    return false;
  };
}

function show_errors(msg) {
  const errors = document.querySelector("#errors");
  errors.style.display = "block";
  errors.innerHTML = msg;
  errors.classList.remove("d-none");
}

function hide_errors() {
  const errors = document.querySelector("#errors");
  errors.innerHTML = "";
  errors.classList.add("d-none");
}

function load_mails(type) {
  const views = document.querySelector("#emails-view");
  let url = "";

  if (type === "inbox") {
    url = "/emails/inbox";
  } else if (type === "sent") {
    url = "/emails/sent";
  } else if (type === "archive") {
    url = "emails/archive";
  }

  fetch(url)
    .then((response) => response.json())
    .then((result) => {
      if (result.length > 0) {
        // create str html template, it's simple
        let render_list_str = "";
        result.forEach((item) => {
          const item_str = `<div data-id="${
            item.id
          }" class="d-flex mailItem border-bottom ${item.read ? "gray" : ""}">
        <div class="mailItem__sender">${item.sender}</div>
        <div class="flex-fill">${item.subject}</div>
        <div class="mailItem__timestamp">${item.timestamp}</div>
    </div>`;
          render_list_str += item_str;
        });

        views.insertAdjacentHTML("beforeend", render_list_str);

        // bind click event
        document.querySelectorAll(".mailItem").forEach(function (item) {
          item.addEventListener("click", function () {
            show_email_entity(this.dataset.id);
            mark_email_status(this.dataset.id, { read: true });
          });
        });
      }
    });
}

function show_email_entity(id) {
  clean_view();
  const entity_email = document.querySelector("#email-entity-view");
  entity_email.style.display = "block";

  fetch(`/emails/${id}`)
    .then((response) => response.json())
    .then((result) => {
      if (!result.error) {
        const entity_email_str_html = `
  <div class="emailBox">
        <div class="emailBox__hd">
            <h4>${result.subject}</h4>
            <ul class="emailBox__ul">
                <li>sender: ${result.sender}</li>
                <li>timestamp: ${result.timestamp}</li>
                <li>recipients: ${result.recipients.join(", ")}</li>
            </ul>
        </div>  
        <div class="emailBox__bd">
            ${result.body}
        </div>
        <div class="emailBox__ft"></div>
    </div>`;

        entity_email.innerHTML = entity_email_str_html;
      }
    });
}

// obj => {read: true/false, archived: true/false}
function mark_email_status(id, obj) {
  fetch(`/emails/${id}`, {
    method: "PUT",
    body: JSON.stringify(obj),
  }).catch((error) => {
    console.error(error);
    show_errors(error);
  });
}

// close all views
function clean_view() {
  document.querySelector("#email-entity-view").style.display = "none";
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#errors").style.display = "none";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";
}
