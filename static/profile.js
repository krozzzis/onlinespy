function interpolateColors(color1, color2, percent) {
    // Ensure percent is between 0 and 100
    percent = Math.min(Math.max(percent, 0), 100) / 100;

    // Convert hex color to RGB
    const hexToRgb = (hex) => {
        let r = parseInt(hex.slice(1, 3), 16);
        let g = parseInt(hex.slice(3, 5), 16);
        let b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    };

    // Convert RGB to hex color
    const rgbToHex = (r, g, b) => {
        const componentToHex = (c) => {
            const hex = c.toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return `#${componentToHex(r)}${componentToHex(g)}${componentToHex(b)}`;
    };

    // Get RGB values of the input colors
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);

    // Calculate the interpolated RGB values
    const r = Math.round(rgb1.r + percent * (rgb2.r - rgb1.r));
    const g = Math.round(rgb1.g + percent * (rgb2.g - rgb1.g));
    const b = Math.round(rgb1.b + percent * (rgb2.b - rgb1.b));

    // Return the interpolated color in hexadecimal format
    return rgbToHex(r, g, b);
}

async function get_name(username) {
  const response = await fetch(`/api/get_name/${username}`)
  const json = await response.json()
  return json
}

async function get_events(year, month, day, username) {
  const response = await fetch(`/api/online/${year}/${month}/${day}/${username}`)
  const json = await response.json()
  return json.events
}

async function get_ranges(year, month, day, username) {
  const events = await get_events(year, month, day, username)
  let ranges = []
  let online_stack = [Date.now()]

  events.forEach(function(event, _, _) {
    if (event.online == true) {
      if (online_stack.length == 1) {
        online_stack[0] = event.time
      } else {
        online_stack.push(event.time)
      }
    } else {
      if (online_stack.length == 1) {
        ranges.push([online_stack[0], event.time])
        online_stack.pop()
      }
    }
  })

  return ranges
}

async function plot_ranges(year, month, day, username) {
  const plot = document.getElementById("plot")
  plot.innerHTML = ' '

  let minutes = []
  for (let i = 0; i < 24*60; i++) {
    minutes.push(0)
  }

  const ranges = await get_ranges(year, month, day, username)

  ranges.forEach((range) => {
    for (let second = range[0]; second <= range[1]; second++) {
      const date = new Date(second * 1000);
      const hour = date.getHours();
      const minute = date.getMinutes();
      minutes[hour * 60 + minute] += 1
    }
  })

  for (let hour = 0; hour < 24; hour++) {
    const line = document.createElement("div")
    line.className = "hour"

    const hour_text = document.createElement("span")
    hour_text.textContent = `${String(hour).padStart(2, '0')}:00`
    hour_text.className = "hour_text"
    line.append(hour_text)

    for (let minute = 0; minute < 60; minute++) {
      const seconds = minutes[hour * 60 + minute]

      let color = "#cecece"
      if (seconds > 0) {
        color = interpolateColors("#006600", "#77ff77", Math.min(seconds / 60 * 100, 60))
      }

      const box = document.createElement("div")
      box.className = "minute"
      box.style.backgroundColor = color;
      box.title = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}\nTotal: ${seconds}s`

      line.append(box)
    }

    plot.append(line)
  }
}

addEventListener("DOMContentLoaded", (event) => {
  const query = window.location.search;
  const params = new URLSearchParams(query)
  const username = params.get("username")

  get_name(username).then((name) => {
    document.getElementById("name").textContent = name
  })

  document.getElementById("date").value = new Date().toISOString().substr(0, 10)

  document.getElementById("pick_date").addEventListener("click", (event) => {
    const datepicker = document.getElementById("date")
    const date = new Date(datepicker.value)
    plot_ranges(date.getFullYear(), date.getMonth() + 1, date.getDate(), username)
  })

  document.getElementById("username").textContent = `@${username}`
  document.getElementById("photo").src = `/static/photo/${username}.jpg`
  plot_ranges(2024, 7, 30, username)


});
