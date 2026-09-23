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
		instance.AutomaticCanvasSize = Enum.AutomaticSize.XY
		instance.CanvasSize = UDim2.new(0, 0, 0, 0)
		
		if nodeData.ScrollAxis == "X" then
			instance.ScrollingDirection = Enum.ScrollingDirection.X
			instance.AutomaticCanvasSize = Enum.AutomaticSize.X
		elseif nodeData.ScrollAxis == "Y" then
			instance.ScrollingDirection = Enum.ScrollingDirection.Y
			instance.AutomaticCanvasSize = Enum.AutomaticSize.Y
		end
	end
	
	if instance:IsA("CanvasGroup") then
		instance.GroupTransparency = nodeData.BackgroundTransparency or 0
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
		stroke.ApplyStrokeMode = (instance:IsA("TextLabel") or instance:IsA("TextButton") or instance:IsA("TextBox"))
			and Enum.ApplyStrokeMode.Contextual
			or Enum.ApplyStrokeMode.Border
		stroke.Parent = instance
	end
	
	if nodeData.Shadow then
		local shadow = Instance.new("UIShadow")
		shadow.Name = "UIShadow"
		-- BlurRadius requires a UDim value in Roblox
		shadow.BlurRadius = UDim.new(0, tonumber(nodeData.Shadow.Blur) or 4)
		shadow.Transparency = tonumber(nodeData.Shadow.Transparency) or 0.5
		if nodeData.Shadow.Offset then
			shadow.Offset = UDim2.new(0, tonumber(nodeData.Shadow.Offset.X) or 0, 0, tonumber(nodeData.Shadow.Offset.Y) or 2)
		end
		shadow.Parent = instance
	end

	if nodeData.Gradient then
		instance.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
		instance.BackgroundTransparency = 0

		local gradient = Instance.new("UIGradient")
		gradient.Name = "UIGradient"
		gradient.Rotation = nodeData.Gradient.Rotation or 90

		local keypoints = {}
		for _, pt in ipairs(nodeData.Gradient.ColorPoints) do
			local timePos = math.clamp(tonumber(pt.Position) or 0, 0, 1)
			table.insert(keypoints, ColorSequenceKeypoint.new(timePos, toColor3(pt.Color)))
		end
		
		table.sort(keypoints, function(a, b) return a.Time < b.Time end)
		
		if #keypoints > 0 and keypoints[1].Time > 0 then
			table.insert(keypoints, 1, ColorSequenceKeypoint.new(0.0, keypoints[1].Value))
		end
		if #keypoints > 0 and keypoints[#keypoints].Time < 1 then
			table.insert(keypoints, ColorSequenceKeypoint.new(1.0, keypoints[#keypoints].Value))
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

	if nodeData.Padding then
		local padding = Instance.new("UIPadding")
		padding.Name = "UIPadding"
		padding.PaddingTop = UDim.new(0, tonumber(nodeData.Padding.Top) or 0)
		padding.PaddingBottom = UDim.new(0, tonumber(nodeData.Padding.Bottom) or 0)
		padding.PaddingLeft = UDim.new(0, tonumber(nodeData.Padding.Left) or 0)
		padding.PaddingRight = UDim.new(0, tonumber(nodeData.Padding.Right) or 0)
		padding.Parent = instance
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

function PropertyMapper.applyTextProperties(instance: TextLabel | TextButton | TextBox, nodeData)
	instance.Text = nodeData.Text or ""
	instance.TextSize = tonumber(nodeData.TextSize) or 14
	instance.Font = Enum.Font.FredokaOne
	instance.AutoLocalize = false
	instance.TextWrapped = nodeData.TextWrapped ~= nil and nodeData.TextWrapped or true
	instance.BackgroundTransparency = 1

	if instance:IsA("TextBox") then
		instance.ClearTextOnFocus = false
		instance.PlaceholderText = "Input..."
	end

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
	
	if nodeData.ImageColor3 then
		instance.ImageColor3 = toColor3(nodeData.ImageColor3)
	end

	if nodeData.ImageBase64 then
		instance:SetAttribute("FigmaBase64Data", nodeData.ImageBase64)
		instance.Image = "rbxasset://textures/ui/GuiImagePlaceholder.png"
	end
end

return PropertyMapper