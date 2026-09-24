local FireporterImporter = {}

local function toUDim2(sizeData)
	if not sizeData then return UDim2.new(0, 100, 0, 100) end
	return UDim2.new(
		tonumber(sizeData.X and sizeData.X.Scale) or 0,
		tonumber(sizeData.X and sizeData.X.Offset) or 100,
		tonumber(sizeData.Y and sizeData.Y.Scale) or 0,
		tonumber(sizeData.Y and sizeData.Y.Offset) or 100
	)
end

local function toColor3(colorData)
	if not colorData then return Color3.fromRGB(255, 255, 255) end
	return Color3.fromRGB(
		math.clamp(math.floor(colorData.r or 255), 0, 255),
		math.clamp(math.floor(colorData.g or 255), 0, 255),
		math.clamp(math.floor(colorData.b or 255), 0, 255)
	)
end

function FireporterImporter.buildTree(nodeData, parentInstance)
	if not nodeData then return end

	local instance
	local nodeType = nodeData.Type or "Frame"

	-- Map Fireporter types to Roblox UI instances safely
	if nodeType == "TextLabel" then
		instance = Instance.new("TextLabel")
		instance.BackgroundTransparency = 1
		
		if nodeData.Text then
			instance.Text = nodeData.Text.Text or ""
			instance.TextSize = tonumber(nodeData.Text.TextSize) or 14
			instance.TextWrapped = true
			
			if nodeData.Text.TextColor3 then
				instance.TextColor3 = toColor3(nodeData.Text.TextColor3)
			end
			
			if nodeData.Text.BackgroundTransparency then
				instance.BackgroundTransparency = tonumber(nodeData.Text.BackgroundTransparency) or 1
			end
		end
	else
		-- Treat general containers, windows, and image layers as clean native Frames to avoid rbxassetid://0 errors
		instance = Instance.new("Frame")
		instance.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
		instance.BackgroundTransparency = 1
	end

	instance.Name = nodeData.Name or "UIElement"
	instance.Size = toUDim2(nodeData.Size)
	instance.Position = toUDim2(nodeData.Position)
	instance.BorderSizePixel = 0

	if nodeData.AnchorPoint then
		instance.AnchorPoint = Vector2.new(
			tonumber(nodeData.AnchorPoint.X) or 0,
			tonumber(nodeData.AnchorPoint.Y) or 0
		)
	end

	instance.Parent = parentInstance

	-- Recursively build all nested child elements
	if nodeData.Children and type(nodeData.Children) == "table" then
		for _, childData in ipairs(nodeData.Children) do
			FireporterImporter.buildTree(childData, instance)
		end
	end

	return instance
end

return FireporterImporter