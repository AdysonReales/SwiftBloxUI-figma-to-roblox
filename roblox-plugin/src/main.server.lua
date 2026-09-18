local HttpService = game:GetService("HttpService")
local UIBuilder = require(script.Parent.UIBuilder)

local toolbar = plugin:CreateToolbar("SwiftBlox UI")
local toggleButton = toolbar:CreateButton(
	"Open SwiftBlox",
	"Open the Figma to Roblox pipeline importer",
	"rbxassetid://4458901886"
)
toggleButton.ClickableWhenViewportHidden = true

local widgetInfo = DockWidgetPluginGuiInfo.new(
	Enum.InitialDockState.Float,
	false,
	false,
	360,
	480,
	300,
	360
)

local widget = plugin:CreateDockWidgetPluginGui("SwiftBlox_StudioCompanion", widgetInfo)
widget.Title = "SwiftBlox UI Companion"

toggleButton.Click:Connect(function()
	widget.Enabled = not widget.Enabled
end)

local hasIris, Iris = pcall(function()
	return require(script.Parent.Iris)
end)

if hasIris and type(Iris) == "table" and Iris.Init then
	Iris.Init(plugin, widget)

	local jsonInputState = Iris.State("")
	local statusMessageState = Iris.State("Waiting for payload...")
	local statusColorState = Iris.State(Color3.fromRGB(170, 170, 170))

	Iris:Connect(function()
		Iris.Window({"SwiftBlox Importer", [Iris.Args.Window.NoClose] = true, [Iris.Args.Window.NoResize] = false})
			Iris.Text({"⚡ SwiftBlox Importer", [Iris.Args.Text.Bold] = true})
			Iris.Text({"Import responsive layouts directly into StarterGui."})
			Iris.Separator()

			Iris.Text({"Option A: Manual Payload", [Iris.Args.Text.Bold] = true})
			Iris.InputText({"Payload (JSON)", [Iris.Args.InputText.Text] = jsonInputState})

			if Iris.Button({"Construct GuiTree"}).clicked then
				local json = jsonInputState:get()
				local success, result = UIBuilder.buildFromJSON(json)
				if success then
					statusMessageState:set("✅ Imported successfully into:\n" .. tostring(result))
					statusColorState:set(Color3.fromRGB(80, 220, 100))
					jsonInputState:set("")
				else
					statusMessageState:set("❌ Error: " .. tostring(result))
					statusColorState:set(Color3.fromRGB(240, 80, 80))
				end
			end

			Iris.Separator()
			Iris.Text({"Option B: Local Bridge", [Iris.Args.Text.Bold] = true})

			if Iris.Button({"Sync from http://localhost:3000"}).clicked then
				statusMessageState:set("Querying local bridge...")
				statusColorState:set(Color3.fromRGB(200, 200, 100))

				task.spawn(function()
					local fetchSuccess, response = pcall(function()
						return HttpService:GetAsync("http://localhost:3000/export", false)
					end)

					if fetchSuccess and response then
						local success, result = UIBuilder.buildFromJSON(response)
						if success then
							statusMessageState:set("✅ Bridge sync complete: " .. tostring(result))
							statusColorState:set(Color3.fromRGB(80, 220, 100))
						else
							statusMessageState:set("❌ Import Failed: " .. tostring(result))
							statusColorState:set(Color3.fromRGB(240, 80, 80))
						end
					else
						statusMessageState:set("❌ Bridge Offline: Ensure bridge server is running.")
						statusColorState:set(Color3.fromRGB(240, 80, 80))
					end
				end)
			end

			Iris.Separator()
			Iris.Text({"Status Log:"})
			Iris.Text({statusMessageState:get(), [Iris.Args.Text.Color] = statusColorState:get()})
		Iris.End()
	end)
else
	-- Native fallback interface if Iris submodule is omitted
	local fallbackContainer = Instance.new("Frame")
	fallbackContainer.Size = UDim2.new(1, 0, 1, 0)
	fallbackContainer.BackgroundColor3 = Color3.fromRGB(36, 36, 36)
	fallbackContainer.BorderSizePixel = 0
	fallbackContainer.Parent = widget

	local padding = Instance.new("UIPadding")
	padding.PaddingTop = UDim.new(0, 12)
	padding.PaddingBottom = UDim.new(0, 12)
	padding.PaddingLeft = UDim.new(0, 12)
	padding.PaddingRight = UDim.new(0, 12)
	padding.Parent = fallbackContainer

	local title = Instance.new("TextLabel")
	title.Text = "⚡ SwiftBlox Importer"
	title.Size = UDim2.new(1, 0, 0, 24)
	title.TextColor3 = Color3.fromRGB(255, 255, 255)
	title.Font = Enum.Font.GothamBold
	title.TextSize = 16
	title.TextXAlignment = Enum.TextXAlignment.Left
	title.BackgroundTransparency = 1
	title.Parent = fallbackContainer

	local textBox = Instance.new("TextBox")
	textBox.PlaceholderText = "Paste exported Figma JSON payload here..."
	textBox.Text = ""
	textBox.ClearTextOnFocus = false
	textBox.MultiLine = true
	textBox.Size = UDim2.new(1, 0, 0, 150)
	textBox.Position = UDim2.new(0, 0, 0, 36)
	textBox.BackgroundColor3 = Color3.fromRGB(24, 24, 24)
	textBox.TextColor3 = Color3.fromRGB(220, 220, 220)
	textBox.TextXAlignment = Enum.TextXAlignment.Left
	textBox.TextYAlignment = Enum.TextYAlignment.Top
	textBox.TextWrapped = true
	textBox.BorderSizePixel = 0
	textBox.Parent = fallbackContainer

	local importBtn = Instance.new("TextButton")
	importBtn.Text = "Construct GuiTree (Option A)"
	importBtn.Size = UDim2.new(1, 0, 0, 36)
	importBtn.Position = UDim2.new(0, 0, 0, 196)
	importBtn.BackgroundColor3 = Color3.fromRGB(24, 160, 251)
	importBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
	importBtn.Font = Enum.Font.GothamBold
	importBtn.BorderSizePixel = 0
	importBtn.Parent = fallbackContainer

	local syncBtn = Instance.new("TextButton")
	syncBtn.Text = "Sync from Bridge Server (Option B)"
	syncBtn.Size = UDim2.new(1, 0, 0, 36)
	syncBtn.Position = UDim2.new(0, 0, 0, 240)
	syncBtn.BackgroundColor3 = Color3.fromRGB(48, 48, 48)
	syncBtn.TextColor3 = Color3.fromRGB(255, 255, 255)
	syncBtn.Font = Enum.Font.GothamBold
	syncBtn.BorderSizePixel = 0
	syncBtn.Parent = fallbackContainer

	local statusLbl = Instance.new("TextLabel")
	statusLbl.Text = "Ready."
	statusLbl.Size = UDim2.new(1, 0, 0, 60)
	statusLbl.Position = UDim2.new(0, 0, 0, 286)
	statusLbl.TextColor3 = Color3.fromRGB(180, 180, 180)
	statusLbl.Font = Enum.Font.Gotham
	statusLbl.TextSize = 13
	statusLbl.TextWrapped = true
	statusLbl.BackgroundTransparency = 1
	statusLbl.Parent = fallbackContainer

	importBtn.MouseButton1Click:Connect(function()
		local success, result = UIBuilder.buildFromJSON(textBox.Text)
		if success then
			statusLbl.TextColor3 = Color3.fromRGB(80, 220, 100)
			statusLbl.Text = "✅ Created: " .. tostring(result)
			textBox.Text = ""
		else
			statusLbl.TextColor3 = Color3.fromRGB(240, 80, 80)
			statusLbl.Text = "❌ " .. tostring(result)
		end
	end)

	syncBtn.MouseButton1Click:Connect(function()
		statusLbl.TextColor3 = Color3.fromRGB(200, 200, 100)
		statusLbl.Text = "Connecting to localhost:3000..."
		task.spawn(function()
			local ok, response = pcall(function()
				return HttpService:GetAsync("http://localhost:3000/export", false)
			end)
			if ok and response then
				local success, result = UIBuilder.buildFromJSON(response)
				if success then
					statusLbl.TextColor3 = Color3.fromRGB(80, 220, 100)
					statusLbl.Text = "✅ Bridge Imported: " .. tostring(result)
				else
					statusLbl.TextColor3 = Color3.fromRGB(240, 80, 80)
					statusLbl.Text = "❌ " .. tostring(result)
				end
			else
				statusLbl.TextColor3 = Color3.fromRGB(240, 80, 80)
				statusLbl.Text = "❌ Bridge unreachable at http://localhost:3000"
			end
		end)
	end)
end