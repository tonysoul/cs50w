(function () {
  const app = {
    current_view: "inbox",
    is_reply: false,
  };

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
    bind_sent_mail();
  });

  function compose_email() {
    app.current_view = "compose";
    app.is_reply = false;
    clean_view();
    // Show compose view and hide other views
    document.querySelector("#compose-view").style.display = "block";
    const compose_recipients = document.querySelector("#compose-recipients");
    compose_recipients.focus();
  }

  // load view
  function load_mailbox(mailbox) {
    clean_view();
    // Show the mailbox and hide other views
    document.querySelector("#emails-view").style.display = "block";

    // Show the mailbox name
    document.querySelector("#emails-view").innerHTML = `<h3>${
      mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
    }</h3>`;

    load_mails(mailbox);
    app.current_view = mailbox;
  }

  // bind sent mail event
  function bind_sent_mail() {
    document.querySelector("#compose-form").onsubmit = function () {
      const recipients = document.querySelector("#compose-recipients").value;
      const subject = document.querySelector("#compose-subject").value;
      let body = document.querySelector("#compose-body").value;

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
          if (result.error) {
            show_errors(result.error);
          } else {
            load_mailbox("sent");
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

  // load mail list
  // type: inbox, sent, archive
  function load_mails(type) {
    const views = document.querySelector("#emails-view");
    let url = "";

    if (type === "inbox") {
      url = "/emails/inbox";
    } else if (type === "sent") {
      url = "/emails/sent";
    } else if (type === "archive") {
      url = "/emails/archive";
    }

    fetch(url)
      .then((response) => response.json())
      .then((result) => {
        if (result.length > 0) {
          // create str html template, it's simple
          let str_list_el = "";
          result.forEach((item) => {
            const str_item = `
            <div data-id="${item.id}" data-read="${
              item.read
            }" class="d-flex mailItem border-bottom ${item.read ? "gray" : ""}">
        <div class="mailItem__sender">${item.sender}</div>
        <div class="flex-fill">${item.subject}</div>
        <div class="mailItem__timestamp">${item.timestamp}</div>
    </div>`;
            str_list_el += str_item;
          });

          views.insertAdjacentHTML("beforeend", str_list_el);

          // bind click event
          document.querySelectorAll(".mailItem").forEach(function (item) {
            item.addEventListener("click", function () {
              show_email_entity(this.dataset.id);
              if (!JSON.parse(this.dataset.read)) {
                mark_email_status(this.dataset.id, { read: true });
              }
            });
          });
        }
      });
  }

  function show_email_entity(id) {
    clean_view();
    const entity_email = document.querySelector("#email-entity-view");
    entity_email.style.display = "block";

    // bind arcihve btn click event
    function bind_archive() {
      const btn = document.querySelector("#email-archive-btn");

      btn.addEventListener("click", async function () {
        await mark_email_status(id, {
          archived: !JSON.parse(this.dataset.archived),
        });
        load_mailbox("inbox");
      });
    }

    // bind reply btn click event
    function bind_reply(result) {
      const btn = document.querySelector("#email-reply-btn");
      btn.addEventListener("click", function () {
        compose_email();
        app.is_reply = true;
        fill_reply_form(result);
      });
    }

    fetch(`/emails/${id}`)
      .then((response) => response.json())
      .then((result) => {
        if (!result.error) {
          const archive_btn = `<button data-archived="${
            result.archived
          }" id="email-archive-btn" class="btn btn-primary btn-sm float-right mr-1">
              ${result.archived ? "Unarchive" : "Archive"}
            </button>`;

          const entity_email_str_html = `
<div class="emailBox">
    <div class="emailBox__hd">
        <button id="email-reply-btn" class="btn btn-info btn-sm float-right">Reply</button>
        ${app.current_view === "sent" ? "" : archive_btn}
        <h4>${result.subject}</h4>
        <ul class="emailBox__ul">
            <li><strong>From:</strong> ${result.sender}</li>
            <li><strong>To:</strong> ${result.recipients.join(", ")}</li>
            <li><strong>Timestamp:</strong> ${result.timestamp}</li>
        </ul>
    </div>  
    <div class="emailBox__bd">
        ${result.body}
    </div>
</div>`;

          entity_email.innerHTML = entity_email_str_html;

          bind_reply(result);

          if (app.current_view !== "sent") {
            bind_archive();
          }
        }
      });
  }

  // result: email entity
  function fill_reply_form(result) {
    let { sender, subject, recipients, body, timestamp } = result;

    if (!subject.startsWith("Re: ")) {
      subject = "Re: " + subject;
    }

    body = `\n\n\n---- Original ----\nOn ${timestamp} ${sender} wrote:\n${body}`;

    // reply yourself
    if (sender === current_user) {
      document.querySelector("#compose-recipients").value =
        recipients.join(", ");
    } else {
      document.querySelector("#compose-recipients").value = sender;
    }

    document.querySelector("#compose-subject").value = subject;
    const compose_body = document.querySelector("#compose-body");
    compose_body.value = body;
    compose_body.focus();
    compose_body.setSelectionRange(0, 0);
  }

  // obj => {read: true/false, archived: true/false}
  async function mark_email_status(id, obj) {
    return fetch(`/emails/${id}`, {
      method: "PUT",
      body: JSON.stringify(obj),
    }).catch((error) => {
      show_errors(error);
    });
  }

  // close all views
  function clean_view() {
    const email_entity = document.querySelector("#email-entity-view");
    email_entity.style.display = "none";
    email_entity.innerHTML = "";
    document.querySelector("#emails-view").style.display = "none";
    document.querySelector("#compose-view").style.display = "none";
    hide_errors();

    // Clear out composition fields
    document.querySelector("#compose-recipients").value = "";
    document.querySelector("#compose-subject").value = "";
    document.querySelector("#compose-body").value = "";
  }
})();
