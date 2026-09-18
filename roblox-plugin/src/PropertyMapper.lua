local PropertyMapper = {}

local function toColor3(data)
	if not data then return Color3.fromRGB(255, 255, 255) end
	return Color3.fromRGB(
		math.clamp(math.floor(data.R or 255), 0, 255),
		math.clamp(math.floor(data.G or 255), 0, 255),
		math.clamp(math.floor(data.B or 255), 0, 255)
	)
end

local function toUDim2(data)
	if not data then return UDim2.new(0, 0, 0, 0) end
	return UDim2.new(
		tonumber(data.ScaleX) or 0,
		tonumber(data.OffsetX) or 0,
		tonumber(data.ScaleY) or 0,
		tonumber(data.OffsetY) or 0
	)
end

function PropertyMapper.applyBasicProperties(instance: GuiObject, nodeData)
	instance.Name = nodeData.Name or "Frame"
	instance.Size = toUDim2(nodeData.Size)
	instance.Position = toUDim2(nodeData.Position)
	instance.BorderSizePixel = 0

	if nodeData.AnchorPoint then
		instance.AnchorPoint = Vector2.new(
			tonumber(nodeData.AnchorPoint.X) or 0,
			tonumber(nodeData.AnchorPoint.Y) or 0
		)
	end

	if nodeData.BackgroundColor3 then
		instance.BackgroundColor3 = toColor3(nodeData.BackgroundColor3)
	end

	if nodeData.BackgroundTransparency ~= nil then
		instance.BackgroundTransparency = tonumber(nodeData.BackgroundTransparency) or 0
	end

	if instance:IsA("ScrollingFrame") then
		instance.ScrollBarThickness = 6
		instance.AutomaticCanvasSize = Enum.AutomaticSize.Y
		instance.CanvasSize = UDim2.new(0, 0, 0, 0)
	end
end

function PropertyMapper.applyDecorations(instance: GuiObject, nodeData)
	if nodeData.CornerRadius and nodeData.CornerRadius > 0 then
		local corner = Instance.new("UICorner")
		corner.Name = "UICorner"
		corner.CornerRadius = UDim.new(0, tonumber(nodeData.CornerRadius) or 0)
		corner.Parent = instance
	end

	if nodeData.Stroke then
		local stroke = Instance.new("UIStroke")
		stroke.Name = "UIStroke"
		stroke.Color = toColor3(nodeData.Stroke.Color)
		stroke.Thickness = tonumber(nodeData.Stroke.Thickness) or 1
		stroke.ApplyStrokeMode = instance:IsA("TextLabel") and Enum.ApplyStrokeMode.Contextual or Enum.ApplyStrokeMode.Border
		stroke.Parent = instance
	end

	if nodeData.Gradient then
		local gradient = Instance.new("UIGradient")
		gradient.Name = "UIGradient"
		gradient.Rotation = nodeData.Gradient.Rotation or 90

		local keypoints = {}
		for _, pt in ipairs(nodeData.Gradient.ColorPoints) do
			table.insert(keypoints, ColorSequenceKeypoint.new(pt.Position, toColor3(pt.Color)))
		end
		if #keypoints >= 2 then
			gradient.Color = ColorSequence.new(keypoints)
			gradient.Parent = instance
		end
	end

	if nodeData.AspectRatio and nodeData.AspectRatio > 0 then
		local ratioConstraint = Instance.new("UIAspectRatioConstraint")
		ratioConstraint.Name = "UIAspectRatioConstraint"
		ratioConstraint.AspectRatio = nodeData.AspectRatio
		ratioConstraint.AspectType = Enum.AspectType.FitWithinMaxSize
		ratioConstraint.DominantAxis = Enum.DominantAxis.Width
		ratioConstraint.Parent = instance
	end

	if nodeData.ListLayout then
		local layout = Instance.new("UIListLayout")
		layout.Name = "UIListLayout"
		layout.Padding = UDim.new(0, tonumber(nodeData.ListLayout.Padding) or 0)
		layout.SortOrder = Enum.SortOrder.LayoutOrder
		layout.FillDirection = nodeData.ListLayout.FillDirection == "Horizontal"
			and Enum.FillDirection.Horizontal
			or Enum.FillDirection.Vertical
		layout.Parent = instance
	end
end

function PropertyMapper.applyTextProperties(instance: TextLabel | TextButton, nodeData)
	instance.Text = nodeData.Text or ""
	instance.TextSize = tonumber(nodeData.TextSize) or 14
	instance.Font = Enum.Font.FredokaOne -- Matches playful/cartoon styles better than Gotham
	instance.AutoLocalize = false
	instance.TextWrapped = nodeData.TextWrapped ~= nil and nodeData.TextWrapped or true

	if nodeData.TextColor3 then
		instance.TextColor3 = toColor3(nodeData.TextColor3)
	end

	if nodeData.TextXAlignment == "Left" then
		instance.TextXAlignment = Enum.TextXAlignment.Left
	elseif nodeData.TextXAlignment == "Right" then
		instance.TextXAlignment = Enum.TextXAlignment.Right
	else
		instance.TextXAlignment = Enum.TextXAlignment.Center
	end

	if nodeData.TextYAlignment == "Top" then
		instance.TextYAlignment = Enum.TextYAlignment.Top
	elseif nodeData.TextYAlignment == "Bottom" then
		instance.TextYAlignment = Enum.TextYAlignment.Bottom
	else
		instance.TextYAlignment = Enum.TextYAlignment.Center
	end
end

function PropertyMapper.applyImageProperties(instance: ImageLabel | ImageButton, nodeData)
	instance.ScaleType = Enum.ScaleType.Fit
	if nodeData.ImageBase64 then
		instance:SetAttribute("FigmaBase64Data", nodeData.ImageBase64)
		-- Check if an asset matching this instance already exists in ServerStorage or ContentProvider
		instance.Image = "rbxasset://textures/ui/GuiImagePlaceholder.png"
	end
end

return PropertyMapper