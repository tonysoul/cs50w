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
  send_mail();
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
  } else if (mailbox === "sent") {
    load_sent_mails();
  } else if (mailbox === "archive") {
  }
}

// send mail
function send_mail() {
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
  errors.innerHTML = msg;
  errors.classList.remove("d-none");
}

function hide_errors() {
  const errors = document.querySelector("#errors");
  errors.innerHTML = "";
  errors.classList.add("d-none");
}

function load_sent_mails() {
  const views = document.querySelector("#emails-view");

  fetch("/emails/sent")
    .then((response) => response.json())
    .then((result) => {
      if (result.length > 0) {
        // create str html template, it's simple
        let render_list_str = "";
        result.forEach((item) => {
          const item_str = `<div class="d-flex mailItem border-bottom">
        <div class="mailItem__sender">${item.sender}</div>
        <div class="flex-fill">${item.subject}</div>
        <div class="mailItem__timestamp">${item.timestamp}</div>
    </div>`;
          render_list_str += item_str;
        });

        views.insertAdjacentHTML("beforeend", render_list_str);

        // bind click event
        document.querySelectorAll(".mailItem").forEach((item) => {
          item.addEventListener("click", () => {
            show_email_entity();
          });
        });
      }
    });
}

function show_email_entity() {
  clean_view();
  const entity_email = document.querySelector("#email-entity-view");
  entity_email.style.display = "block";
  entity_email.innerHTML = "123";
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
