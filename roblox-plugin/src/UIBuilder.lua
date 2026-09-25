local HttpService = game:GetService("HttpService")

local hasMapper, PropertyMapper = pcall(function()
    return require(script.Parent.PropertyMapper)
end)

local UIBuilder = {}

local function buildNodeRecursive(nodeData, parent, depth)
    local className = nodeData.ClassName or "Frame"
    local success, instance = pcall(function()
        return Instance.new(className)
    end)

    if not success or not instance then
        instance = Instance.new("Frame")
    end

    if hasMapper and PropertyMapper and PropertyMapper.applyBaseProperties then
        PropertyMapper.applyBaseProperties(instance, nodeData, depth)
    else
        instance.Name = nodeData.Name or "UIElement"
    end

    if hasMapper and PropertyMapper and PropertyMapper.applyTextProperties then
        if instance:IsA("TextLabel") or instance:IsA("TextButton") or instance:IsA("TextBox") then
            PropertyMapper.applyTextProperties(instance, nodeData)
        end
    end

    if hasMapper and PropertyMapper and PropertyMapper.applyDecorations then
        PropertyMapper.applyDecorations(instance, nodeData)
    end

    if nodeData.Children and type(nodeData.Children) == "table" then
        for _, childData in ipairs(nodeData.Children) do
            buildNodeRecursive(childData, instance, depth + 1)
        end
    end

    if parent then
        instance.Parent = parent
    end

    return instance
end

function UIBuilder.buildFromJSON(rawJson)
    local success, decoded = pcall(function()
        return HttpService:JSONDecode(rawJson)
    end)

    if not success or not decoded then
        return false, "JSON Decode Failed: " .. tostring(decoded)
    end

    local screenGui = Instance.new("ScreenGui")
    screenGui.Name = decoded.Name or "SwiftBlox_Imports"
    screenGui.ResetOnSpawn = false
    screenGui.Parent = game:GetService("StarterGui")

    local ok, err = pcall(function()
        buildNodeRecursive(decoded, screenGui, 1)
    end)

    if ok then
        return true, screenGui.Name
    else
        return false, tostring(err)
    end
end

return UIBuilder