local PropertyMapper = {}

local function toUDim2(data)
    if not data then return UDim2.new(0, 0, 0, 0) end
    return UDim2.new(
        tonumber(data.ScaleX) or 0,
        tonumber(data.OffsetX) or 0,
        tonumber(data.ScaleY) or 0,
        tonumber(data.OffsetY) or 0
    )
end

local function toColor3(colorData)
    if not colorData then return Color3.fromRGB(255, 255, 255) end
    return Color3.fromRGB(
        math.clamp(math.floor(colorData.R or 255), 0, 255),
        math.clamp(math.floor(colorData.G or 255), 0, 255),
        math.clamp(math.floor(colorData.B or 255), 0, 255)
    )
end

local function getFontWeight(weightName)
    local weights = {
        Thin = Enum.FontWeight.Thin, ExtraLight = Enum.FontWeight.ExtraLight,
        Light = Enum.FontWeight.Light, Regular = Enum.FontWeight.Regular,
        Medium = Enum.FontWeight.Medium, SemiBold = Enum.FontWeight.SemiBold,
        Bold = Enum.FontWeight.Bold, ExtraBold = Enum.FontWeight.ExtraBold,
        Heavy = Enum.FontWeight.Heavy,
    }
    return weights[weightName] or Enum.FontWeight.Regular
end

local function createFont(nodeData)
    local family = nodeData.FontFamily
    if not family or family == "" then return Font.fromEnum(Enum.Font.FredokaOne) end
    local weight = getFontWeight(nodeData.FontWeight)
    local style = (nodeData.FontStyle and string.find(string.lower(nodeData.FontStyle), "italic", 1, true)) and Enum.FontStyle.Italic or Enum.FontStyle.Normal

    local success, font = pcall(function() return Font.fromName(family, weight, style) end)
    return (success and font) and font or Font.fromEnum(Enum.Font.FredokaOne)
end

function PropertyMapper.applyBaseProperties(instance, nodeData, depth)
    instance.Name = nodeData.Name or "UIElement"
    instance.Size = toUDim2(nodeData.Size)
    instance.Position = toUDim2(nodeData.Position)
    instance.BorderSizePixel = 0
    instance.ClipsDescendants = false
    instance.ZIndex = depth or 1

    if nodeData.AnchorPoint then
        instance.AnchorPoint = Vector2.new(tonumber(nodeData.AnchorPoint.X) or 0, tonumber(nodeData.AnchorPoint.Y) or 0)
    end
    if nodeData.Rotation ~= nil then instance.Rotation = tonumber(nodeData.Rotation) or 0 end
    if nodeData.BackgroundColor3 then instance.BackgroundColor3 = toColor3(nodeData.BackgroundColor3) end
    if nodeData.BackgroundTransparency ~= nil then instance.BackgroundTransparency = tonumber(nodeData.BackgroundTransparency) end
end

function PropertyMapper.applyTextProperties(instance, nodeData)
    instance.Text = nodeData.Text or ""
    instance.TextSize = tonumber(nodeData.TextSize) or 14
    instance.FontFace = createFont(nodeData)
    instance.AutoLocalize = false
    instance.TextWrapped = true
    instance.TextScaled = false -- Forces exact Figma font sizing

    -- GUARANTEE TEXT BACKGROUNDS ARE INVISIBLE
    instance.BackgroundTransparency = 1
    instance.BackgroundColor3 = Color3.fromRGB(255, 255, 255)

    if nodeData.TextColor3 then
        instance.TextColor3 = toColor3(nodeData.TextColor3)
        if nodeData.TextColor3.A ~= nil then instance.TextTransparency = 1 - nodeData.TextColor3.A end
    end

    local alignX = { Left = Enum.TextXAlignment.Left, Right = Enum.TextXAlignment.Right, Center = Enum.TextXAlignment.Center }
    local alignY = { Top = Enum.TextYAlignment.Top, Bottom = Enum.TextYAlignment.Bottom, Center = Enum.TextYAlignment.Center }
    
    instance.TextXAlignment = alignX[nodeData.TextXAlignment] or Enum.TextXAlignment.Center
    instance.TextYAlignment = alignY[nodeData.TextYAlignment] or Enum.TextYAlignment.Center
end

function PropertyMapper.applyDecorations(instance, nodeData)
    if nodeData.CornerRadius and nodeData.CornerRadius > 0 then
        local corner = Instance.new("UICorner")
        corner.CornerRadius = UDim.new(0, tonumber(nodeData.CornerRadius))
        corner.Parent = instance
    end

    if nodeData.Stroke then
        local stroke = Instance.new("UIStroke")
        stroke.Color = toColor3(nodeData.Stroke.Color)
        stroke.Thickness = tonumber(nodeData.Stroke.Thickness) or 1
        
        -- THE FIX: Force outlines to hug text, preventing dark background boxes!
        if instance:IsA("TextLabel") or instance:IsA("TextBox") or instance:IsA("TextButton") then
            stroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Contextual
        else
            stroke.ApplyStrokeMode = Enum.ApplyStrokeMode.Border
        end
        stroke.Parent = instance
    end

    if nodeData.Gradient then
        instance.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
        instance.BackgroundTransparency = 0
        local gradient = Instance.new("UIGradient")
        gradient.Rotation = tonumber(nodeData.Gradient.Rotation) or 0
        gradient.Type = Enum.GradientType[nodeData.Gradient.Type] or Enum.GradientType.Linear

        local colorKeypoints, transparencyKeypoints = {}, {}
        for _, pt in ipairs(nodeData.Gradient.ColorPoints or {}) do table.insert(colorKeypoints, ColorSequenceKeypoint.new(math.clamp(tonumber(pt.Position) or 0, 0, 1), toColor3(pt.Color))) end
        for _, pt in ipairs(nodeData.Gradient.TransparencyPoints or {}) do table.insert(transparencyKeypoints, NumberSequenceKeypoint.new(math.clamp(tonumber(pt.Position) or 0, 0, 1), math.clamp(tonumber(pt.Transparency) or 0, 0, 1))) end

        table.sort(colorKeypoints, function(a, b) return a.Time < b.Time end)
        table.sort(transparencyKeypoints, function(a, b) return a.Time < b.Time end)

        if #colorKeypoints > 0 then
            if colorKeypoints[1].Time > 0 then table.insert(colorKeypoints, 1, ColorSequenceKeypoint.new(0.0, colorKeypoints[1].Value)) end
            if colorKeypoints[#colorKeypoints].Time < 1 then table.insert(colorKeypoints, ColorSequenceKeypoint.new(1.0, colorKeypoints[#colorKeypoints].Value)) end
        end
        if #transparencyKeypoints > 0 then
            if transparencyKeypoints[1].Time > 0 then table.insert(transparencyKeypoints, 1, NumberSequenceKeypoint.new(0.0, transparencyKeypoints[1].Value)) end
            if transparencyKeypoints[#transparencyKeypoints].Time < 1 then table.insert(transparencyKeypoints, NumberSequenceKeypoint.new(1.0, transparencyKeypoints[#transparencyKeypoints].Value)) end
        end

        if #colorKeypoints >= 2 then gradient.Color = ColorSequence.new(colorKeypoints) end
        if #transparencyKeypoints >= 2 then gradient.Transparency = NumberSequence.new(transparencyKeypoints) end
        gradient.Parent = instance
    end
end

return PropertyMapper