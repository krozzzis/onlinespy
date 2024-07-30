async function get_users() {
  const response = await fetch("/get_users")
  const json = await response.json()
  return json
}

async function create_list() {
  const list = document.getElementById("list")  

  const users = await get_users()
  users.sort((a, b) => a[1] > b[1])
  users.forEach((user) => {
    console.log(user)
    let entry = document.createElement("ul")
    entry.className = "list_entry"

    let image = document.createElement("img")
    image.src = `/static/photo/${user[0]}.jpg`
    image.className = "list_entry_photo"
    entry.append(image)

    let link = document.createElement("a")
    link.href = `/static/profile.html?username=${user[0]}`
    link.textContent = `${user[1]} @${user[0]}`
    link.className = "list_entry_link"
    entry.append(link)


    list.append(entry)
  })
}

addEventListener("DOMContentLoaded", (event) => {
  create_list()
})
